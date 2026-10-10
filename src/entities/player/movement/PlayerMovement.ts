import { TILE_SIZE } from "@/config/tiles";
import { ControllerKey } from "@/input/ControllerKey";
import { DirectionAxisX } from "@/miscellaneous/Direction";
import { PowerUps } from "@/miscellaneous/Inventory";
import {
  getAcceleration,
  getDeceleration,
} from "@/entities/player/horizontalMotion";
import { JumpAssist } from "@/entities/player/JumpAssist";
import { MovementHost } from "@/entities/player/movement/host";
import { MovementState, hasGravity } from "@/entities/player/movement/state";

/**
 * The state machine of the Player's movement.
 *
 * `state` says what the Player is doing with its body, one thing at a time:
 * standing, crouching, in the air, hanging from a ledge, on a ladder, pulling
 * itself up a ledge. Before there were a dozen booleans (`isHanging`,
 * `isCrouch`, `isAttachOnLadder`...) which could all be true together.
 *
 * Every frame the actions run in a fixed order: jump, walk, dash, hang,
 * ladders, then (after the Player has resized its body) crouch. Each one asks
 * the state what it is allowed to do, and changes it when something happens.
 * At the end the state is settled (on the floor or in the air) and the gravity
 * is set for it in one place: there is none while holding on to something.
 */
export class PlayerMovement {
  public state: MovementState = MovementState.GROUNDED;

  /** The Player is in the air because of a jump */
  public isJumping = false;

  /** The jump was started (almost) standing still: it has its own animation */
  public isStandingJumping = false;

  /** The Player is going down in the air */
  public isFalling = false;

  /** The Player can now do the double jump */
  public canDoubleJump = false;

  /** The Player has already done the double jump */
  public hasDoneDoubleJump = false;

  /** The Player is in the air touching one wall, so it can wall jump */
  public canWallJump = false;

  /** The Player is near a ladder (as found in the last frame) */
  public isOnLadder = false;

  /** The jump button was down in the previous frame */
  private isPressingJump = false;

  /** Crouching is allowed in this frame (not while moving or in the air) */
  private canCrouch = true;

  /** A ledge climb was started in this frame */
  private climbRequested = false;

  /** The current ledge climb started from hanging, not from the floor */
  private climbFromHang = false;

  public constructor(private readonly jumpAssist = new JumpAssist()) {}

  public get isHanging(): boolean {
    return (
      this.state === MovementState.HANGING ||
      (this.state === MovementState.CLIMBING_LEDGE && this.climbFromHang)
    );
  }

  public get isCrouch(): boolean {
    return this.state === MovementState.CROUCHING;
  }

  public get isAttachOnLadder(): boolean {
    return this.state === MovementState.ON_LADDER;
  }

  /**
   * Every action which moves the body. Call it every frame the Player can be
   * controlled, then `updateCrouch`.
   */
  public updateMotion(host: MovementHost): void {
    // Prevent jump when is facing forward
    if (host.facing.x !== DirectionAxisX.CENTER) {
      this.jump(host);
    }

    this.walk(host);
    this.dash(host);
    this.hang(host);
    this.climbLadders(host);
  }

  /**
   * The last action of the frame: crouch, and the state is settled. The
   * Player resizes its body between `updateMotion` and this.
   */
  public updateCrouch(host: MovementHost): void {
    // Prevent crouch when is facing forward
    if (host.facing.x !== DirectionAxisX.CENTER) {
      this.crouch(host);
    }

    this.settle(host);
  }

  /** The Player has finished pulling itself up: back to being in the world */
  public finishClimb(): void {
    if (this.state === MovementState.CLIMBING_LEDGE) {
      this.state = MovementState.AIRBORNE;
    }

    this.climbFromHang = false;
  }

  /** Handle all the movement along the y axis */
  private jump(host: MovementHost): void {
    const { input } = host;
    const isJumpPress = input.jump;

    const now = host.now;
    this.jumpAssist.update(now, host.isOnFloor(), isJumpPress);

    // First check if Player has unlocked wall jump
    if (host.equip(PowerUps.GLOVE)) {
      // Test if the Player is near walls
      const walls = [
        host.isTouchingWall(DirectionAxisX.LEFT),
        host.isTouchingWall(DirectionAxisX.RIGHT),
      ];
      const wallsCount = walls.filter((wall) => wall).length;

      // Perform wall jump only if the Player
      // is not on the ground and is touching only one wall
      this.canWallJump = !host.isOnFloor() && wallsCount === 1;

      // The user have to press again the jump key to perform the action
      if (this.canWallJump && !this.isPressingJump && isJumpPress) {
        let sign = 0;

        if (walls[0] && input.right) {
          // The Player is touching a wall on left and
          // the user is moving on the opposite side of wall (right)
          sign = 1;
        } else if (walls[1] && input.left) {
          // The Player is touching a wall on right and
          // the user is moving on the opposite side of wall (left)
          sign = -1;
        }

        if (sign !== 0) {
          this.isJumping = true;

          // Then push the player on the opposite side of wall and to the ceil
          host.setVelocity(
            Math.abs(host.getJumpSpeed(false)) * 2 * sign,
            host.getJumpSpeed()
          );

          this.jumpAssist.notifyJumped();
        }
      }
    }

    let isClimbing = false;
    if (this.state === MovementState.HANGING) {
      if (!this.isPressingJump) {
        // The down button lets go of the ledge: it wins over climbing
        isClimbing = (input.up || isJumpPress) && !input.down;

        if (isClimbing) {
          this.startClimb(host, TILE_SIZE, TILE_SIZE * 2);
        }
      }
    } else if (isJumpPress) {
      // If the Player is touching the floor (or has just left it) and the key
      // has been released (or has been pressed a moment before landing)
      if (
        this.jumpAssist.canJumpFromGround(now, host.isOnFloor()) &&
        (!this.isPressingJump ||
          this.jumpAssist.hasBufferedPress(now, isJumpPress))
      ) {
        this.jumpAssist.notifyJumped();

        if (host.blocked.right || host.blocked.left) {
          isClimbing = host.hasLedgeToClimb(host.blocked.left);
        }

        if (!isClimbing) {
          // The Player is actually jumping: a new jump, so no double jump
          // from a previous one is left (the key may have been held since landing)
          this.isJumping = true;
          this.canDoubleJump = false;
          this.hasDoneDoubleJump = false;

          const velocity = Math.abs(host.velocity.x);
          this.isStandingJumping = velocity <= TILE_SIZE * 2;
          if (this.isStandingJumping) {
            host.setMaxVelocity(
              host.getStandingRunSpeed(),
              host.getMaxJumpSpeed()
            );
          }

          host.setVelocityY(host.getJumpSpeed());
        } else {
          this.startClimb(host, TILE_SIZE, TILE_SIZE);
        }
      } else if (
        // First check if Player has unlocked double jump
        host.equip(PowerUps.ROCKET) &&
        // Then check if Player had already performed the action
        !this.hasDoneDoubleJump &&
        // Finally check if Player can actually perform the action at the moment
        this.canDoubleJump
      ) {
        this.jumpAssist.notifyJumped();

        // Prevent the Player to perform another double jump
        this.hasDoneDoubleJump = true;
        // The Player is actually jumping
        this.isJumping = true;

        this.isStandingJumping = Math.abs(host.velocity.x) <= TILE_SIZE;

        host.setVelocityY(host.getJumpSpeed());
      }
    } else if (host.isOnFloor()) {
      // Reset everything if the player is touching the ground
      this.isFalling = false;
      this.isJumping = false;

      this.canDoubleJump = false;
      this.hasDoneDoubleJump = false;
    }

    if (host.velocity.y === 0 && host.isOnFloor()) {
      this.isStandingJumping = false;
    }

    if (!this.isStandingJumping) {
      host.setMaxVelocity(host.getMaxRunSpeed(), host.getMaxJumpSpeed());
    }

    // Check if the user is actually holding the key
    this.isPressingJump = isJumpPress;

    // Detect if the Player is falling by checking if his y speed is positive
    if (host.velocity.y > 0) {
      this.isFalling = true;
      // If the Player is falling, he cannot also jump
      this.isJumping = false;
    } else {
      this.isFalling = false;
    }

    // Detect if the Player is jumping by checking if his y speed is negative
    if (host.velocity.y < 0) {
      // Detect if the user is not pressing the button to jump
      if (!isJumpPress && !isClimbing && !input.up) {
        // The Player is able to perform a double jump
        this.canDoubleJump = true;

        const newVelocity = host.velocity.y + -(host.velocity.y / 2);

        // NOTE: while going up newVelocity is always negative, so the
        // Math.max makes this cut the jump dead (y speed = 0) instead of
        // damping it. Use Math.min(newVelocity, 0) for a softer cut.
        host.setVelocityY(Math.max(newVelocity, 0));
      }
    }

    // When the Player is in mid air, he must stand up
    if (host.velocity.y !== 0) {
      this.canCrouch = false;
      this.stopCrouching();
    }
  }

  /** Handle all the movement along the x axis */
  private walk(host: MovementHost): void {
    const isRightPress = host.input.right;
    const isLeftPress = host.input.left;

    // When the Player is moving, he cannot also be crouch
    if (isRightPress || isLeftPress) {
      this.canCrouch = false;
      this.stopCrouching();
    }

    if (isRightPress && !isLeftPress) {
      host.facingForAim.x = DirectionAxisX.RIGHT;
    } else if (isLeftPress && !isRightPress) {
      host.facingForAim.x = DirectionAxisX.LEFT;
    }

    if (this.state === MovementState.HANGING) {
      // Do not keep pushing with the acceleration of the last frame
      host.setAccelerationX(0);

      return;
    }

    if (isRightPress && !isLeftPress) {
      host.facing.x = DirectionAxisX.RIGHT;

      host.setAccelerationX(
        getAcceleration(1, host.getRunSpeed(), host.velocity.x)
      );
    } else if (isLeftPress && !isRightPress) {
      host.facing.x = DirectionAxisX.LEFT;

      host.setAccelerationX(
        getAcceleration(-1, host.getRunSpeed(), host.velocity.x)
      );
    } else {
      host.setAccelerationX(0);

      // With no button pressed the body slows down with this drag: a short
      // slide on the floor, a longer one in the air (see horizontalMotion.ts)
      host.setDragX(
        getDeceleration(host.getMaxRunSpeed(), {
          isOnFloor: host.isOnFloor(),
          isSwimming: host.isSwimming,
        })
      );

      // Stop it if it is slow enough
      if (Math.abs(host.velocity.x) < host.baseSpeed / 20) {
        host.setVelocityX(0);
      }
    }
  }

  /** Handle the dash action */
  private dash(host: MovementHost): void {
    if (!host.equip(PowerUps.DASH)) {
      return;
    }

    const time = host.input.getDashDuration();

    if (
      time < 100 &&
      host.input.dash &&
      host.battery > 0 &&
      host.facing.x !== DirectionAxisX.CENTER
    ) {
      const facing = host.facing.x === DirectionAxisX.RIGHT ? 1 : -1;

      host.setMaxVelocity(host.getDashSpeed(), host.getMaxJumpSpeed());
      host.setVelocityX(host.getDashSpeed() * facing);

      --host.battery;
    } else {
      host.setMaxVelocity(
        this.isStandingJumping
          ? host.getStandingRunSpeed()
          : host.getMaxRunSpeed(),
        host.getMaxJumpSpeed()
      );
    }
  }

  /** Handle the hang action */
  private hang(host: MovementHost): void {
    // Holding a ladder, the Player does not grab the ledges it passes
    if (this.state === MovementState.ON_LADDER) {
      return;
    }

    if (!host.equip(PowerUps.HOOK)) {
      return;
    }

    if (host.velocity.y !== 0 || this.state === MovementState.HANGING) {
      // If the Player is hanging from a tile, he can jump down
      if (host.input.down) {
        this.stopHanging();

        return;
      }

      let side: DirectionAxisX.LEFT | DirectionAxisX.RIGHT | undefined;

      if (host.facing.x === DirectionAxisX.LEFT) {
        side = DirectionAxisX.LEFT;
      } else if (host.facing.x === DirectionAxisX.RIGHT) {
        side = DirectionAxisX.RIGHT;
      }

      if (typeof side !== "undefined") {
        // The tile the Player is touching with the hand, if it can be grabbed
        const ledge = host.findLedge(side);

        if (ledge) {
          this.state = MovementState.HANGING;

          host.setVelocityY(0);
          // Align the body to the current tile
          host.moveTo(null, ledge.pixelY);
        } else {
          this.stopHanging();
        }
      }
    }
  }

  /** Handle the ladders climb action */
  private climbLadders(host: MovementHost): void {
    const isOnTopOfLadder = host.isOnLadderTop();
    this.isOnLadder = host.overlapsLadder();

    const isDownPressed = host.input.down;
    const isUpPressed = host.input.up;

    let isAttached = this.state === MovementState.ON_LADDER;

    if (this.isOnLadder || isOnTopOfLadder) {
      if (host.isOnFloor() || !this.isOnLadder) {
        isAttached = false;
      }

      if (isDownPressed || (isUpPressed && this.isOnLadder)) {
        const speed = isDownPressed ? 1 : -1;
        host.setVelocityY(host.getLadderClimbSpeed() * speed);

        isAttached = true;
      }
    } else {
      isAttached = false;
    }

    if (isAttached) {
      this.state = MovementState.ON_LADDER;

      if (!isUpPressed && !isDownPressed) {
        host.setVelocityY(0);
      }
    } else if (this.state === MovementState.ON_LADDER) {
      this.state = MovementState.AIRBORNE;
    }
  }

  /** Handle the crouch action */
  private crouch(host: MovementHost): void {
    // Test if the Player can crouch in the current state and position
    if (this.canCrouch) {
      const isDownPressed = host.input.justPressed(ControllerKey.DOWN);
      const isUpPressed = host.input.up;

      if (isDownPressed && this.state !== MovementState.CROUCHING) {
        if (!host.isAimingDiagonal || host.previousFacing.y === host.facing.y) {
          // Only on the floor: crouching in the air for a frame, when letting
          // go of a ledge with the down button, made the body shrink and grow.
          // (AIRBORNE is still the state in the frame of the landing.)
          if (
            host.isOnFloor() &&
            (this.state === MovementState.GROUNDED ||
              this.state === MovementState.AIRBORNE)
          ) {
            this.state = MovementState.CROUCHING;
          }
        }
      } else if (isUpPressed && this.state === MovementState.CROUCHING) {
        this.state = MovementState.GROUNDED;
      }
    }

    this.canCrouch = true;
  }

  /** The end of the frame: the state is settled and gravity is set for it */
  private settle(host: MovementHost): void {
    if (this.climbRequested) {
      this.state = MovementState.CLIMBING_LEDGE;
      this.climbRequested = false;
    } else if (
      this.state === MovementState.GROUNDED ||
      this.state === MovementState.CROUCHING ||
      this.state === MovementState.AIRBORNE
    ) {
      if (!host.isOnFloor()) {
        this.state = MovementState.AIRBORNE;
      } else if (this.state === MovementState.AIRBORNE) {
        this.state = MovementState.GROUNDED;
      }
    }

    host.setAllowGravity(hasGravity(this.state));
  }

  /** Pull the Player up a ledge: the state changes at the end of the frame */
  private startClimb(host: MovementHost, x: number, y: number): void {
    this.climbFromHang = this.state === MovementState.HANGING;
    this.climbRequested = true;

    host.climb(x, y);
  }

  private stopHanging(): void {
    if (this.state === MovementState.HANGING) {
      this.state = MovementState.AIRBORNE;
    }
  }

  private stopCrouching(): void {
    if (this.state === MovementState.CROUCHING) {
      this.state = MovementState.GROUNDED;
    }
  }
}
