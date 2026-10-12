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

/**
 * The movement of the Player as it was before the state machine: jump(),
 * walk(), dash(), hang(), climbLadders() and crouch() of Player.ts, copied
 * with the booleans they used (`isHanging`, `isCrouch`, `isAttachOnLadder`...).
 * It is what the state machine is compared with.
 *
 * Only a few things were changed, all of them on purpose and also done by
 * the state machine (marked DEVIATION):
 * 1. gravity is decided in one place, at the end, not by every action;
 * 2. a Player crouches only on the floor;
 * 3. a Player holding a ladder does not grab the ledges;
 * 4. when a ledge climb is over the Player is not hanging any more at once
 *    (it was, until the next hang(): that frame it ignored the buttons and
 *    could start the climb again);
 * 5. holding a ladder and crouching are not both true;
 * 6. starting to climb a ledge ends the crouch;
 * 7. the down button lets go of a ledge and wins over climbing it;
 * 8. a Player in the air is not crouching, at once (it took until its y speed
 *    was not 0).
 */
export class LegacyMovement {
  public isHanging = false;
  public isCrouch = false;
  public isAttachOnLadder = false;
  public isOnLadder = false;
  public isJumping = false;
  public isStandingJumping = false;
  public isFalling = false;
  public canDoubleJump = false;
  public hasDoneDoubleJump = false;
  public canWallJump = false;

  private isPressingJump = false;
  private canCrouch = true;
  /** DEVIATION 1: a ledge climb is going on */
  private isClimbingLedge = false;

  private readonly jumpAssist = new JumpAssist();

  public updateMotion(host: MovementHost): void {
    if (host.facing.x !== DirectionAxisX.CENTER) {
      this.jump(host);
    }

    this.walk(host);
    this.dash(host);
    this.hang(host);
    this.climbLadders(host);
  }

  public updateCrouch(host: MovementHost): void {
    if (host.facing.x !== DirectionAxisX.CENTER) {
      this.crouch(host);
    }

    // DEVIATION 8
    if (this.isCrouch && !host.isOnFloor()) {
      this.isCrouch = false;
    }

    // DEVIATION 1
    host.setAllowGravity(
      !(this.isHanging || this.isAttachOnLadder || this.isClimbingLedge)
    );
  }

  public finishClimb(): void {
    this.isClimbingLedge = false;
    // DEVIATION 4
    this.isHanging = false;
  }

  private jump(host: MovementHost): void {
    const isJumpPress = host.input.jump;

    const now = host.now;
    this.jumpAssist.update(now, host.isOnFloor(), isJumpPress);

    if (host.equip(PowerUps.GLOVE)) {
      const walls: boolean[] = [
        host.isTouchingWall(DirectionAxisX.LEFT),
        host.isTouchingWall(DirectionAxisX.RIGHT),
      ];
      const wallsCount = walls.filter((wall) => wall);

      this.canWallJump = !host.isOnFloor() && wallsCount.length === 1;

      if (this.canWallJump) {
        if (!this.isPressingJump && isJumpPress) {
          let sign = 0;

          if (walls[0] && host.input.right) {
            sign = 1;
          } else if (walls[1] && host.input.left) {
            sign = -1;
          }

          if (sign !== 0) {
            this.isJumping = true;

            host.setVelocity(
              Math.abs(host.getJumpSpeed(false)) * 2 * sign,
              host.getJumpSpeed()
            );

            this.jumpAssist.notifyJumped();
          }
        }
      }
    }

    let isClimbing = false;
    if (this.isHanging) {
      if (!this.isPressingJump) {
        const isUpPress: boolean = host.input.up;

        // DEVIATION 7
        isClimbing = (isUpPress || isJumpPress) && !host.input.down;

        if (isClimbing) {
          this.climb(host, TILE_SIZE, TILE_SIZE * 2);
        }
      }
    } else if (isJumpPress) {
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
          this.climb(host, TILE_SIZE, TILE_SIZE);
        }
      } else if (
        host.equip(PowerUps.ROCKET) &&
        !this.hasDoneDoubleJump &&
        this.canDoubleJump
      ) {
        this.jumpAssist.notifyJumped();

        this.hasDoneDoubleJump = true;
        this.isJumping = true;

        this.isStandingJumping = Math.abs(host.velocity.x) <= TILE_SIZE;

        host.setVelocityY(host.getJumpSpeed());
      }
    } else if (host.isOnFloor()) {
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

    this.isPressingJump = isJumpPress;

    if (host.velocity.y > 0) {
      this.isFalling = true;
      this.isJumping = false;
    } else {
      this.isFalling = false;
    }

    if (host.velocity.y < 0) {
      const isUpPress: boolean = host.input.up;

      if (!isJumpPress && !isClimbing && !isUpPress) {
        this.canDoubleJump = true;

        const newVelocity = host.velocity.y + -(host.velocity.y / 2);

        host.setVelocityY(Math.max(newVelocity, 0));
      }
    }

    if (host.velocity.y !== 0) {
      this.canCrouch = false;
      this.isCrouch = false;
    }
  }

  private walk(host: MovementHost): void {
    const isRightPress: boolean = host.input.right;
    const isLeftPress: boolean = host.input.left;

    if (isRightPress || isLeftPress) {
      this.canCrouch = false;
      this.isCrouch = false;
    }

    if (isRightPress && !isLeftPress) {
      host.facingForAim.x = DirectionAxisX.RIGHT;
    } else if (isLeftPress && !isRightPress) {
      host.facingForAim.x = DirectionAxisX.LEFT;
    }

    if (this.isHanging) {
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

      host.setDragX(
        getDeceleration(host.getMaxRunSpeed(), {
          isOnFloor: host.isOnFloor(),
          isSwimming: host.isSwimming,
        })
      );

      if (Math.abs(host.velocity.x) < host.baseSpeed / 20) {
        host.setVelocityX(0);
      }
    }
  }

  private dash(host: MovementHost): void {
    const isDashPress: boolean = host.input.dash;

    if (host.equip(PowerUps.DASH)) {
      const time = host.input.getDashDuration();

      if (
        time < 100 &&
        isDashPress &&
        host.battery > 0 &&
        host.facing.x !== DirectionAxisX.CENTER
      ) {
        const isRight = host.facing.x === DirectionAxisX.RIGHT;
        const facing: number = isRight ? 1 : -1;

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
  }

  private hang(host: MovementHost): void {
    // DEVIATION 3
    if (this.isAttachOnLadder) {
      return;
    }

    if (host.equip(PowerUps.HOOK)) {
      if (host.velocity.y !== 0 || this.isHanging) {
        const isDownPress: boolean = host.input.down;

        if (isDownPress) {
          this.isHanging = false;
          host.setAllowGravity(true);
          return;
        }

        let side: DirectionAxisX.LEFT | DirectionAxisX.RIGHT | undefined;

        if (host.facing.x === DirectionAxisX.LEFT) {
          side = DirectionAxisX.LEFT;
        } else if (host.facing.x === DirectionAxisX.RIGHT) {
          side = DirectionAxisX.RIGHT;
        }

        if (typeof side !== "undefined") {
          const ledge = host.findLedge(side);

          if (ledge) {
            this.isHanging = true;
            host.setAllowGravity(false);

            host.setVelocityY(0);
            host.moveTo(null, ledge.pixelY);
          } else {
            this.isHanging = false;

            host.setAllowGravity(true);
          }
        }
      }
    }
  }

  private climbLadders(host: MovementHost): void {
    const isOnTopOfLadder = host.isOnLadderTop();

    this.isOnLadder = host.overlapsLadder();

    const isDownPressed: boolean = host.input.down;

    const isUpPressed: boolean = host.input.up;

    if (this.isOnLadder || isOnTopOfLadder) {
      if (host.isOnFloor() || !this.isOnLadder) {
        if (this.isAttachOnLadder) {
          this.isAttachOnLadder = false;
        }
      }

      if (isDownPressed || (isUpPressed && this.isOnLadder)) {
        const speed = isDownPressed ? 1 : -1;
        host.setVelocityY(host.getLadderClimbSpeed() * speed);

        this.isAttachOnLadder = true;
      }
    } else {
      this.isAttachOnLadder = false;
    }

    if (this.isAttachOnLadder) {
      host.setAllowGravity(false);

      // DEVIATION 5
      this.isCrouch = false;

      if (!isUpPressed && !isDownPressed) {
        host.setVelocityY(0);
      }
    } else {
      host.setAllowGravity(true);
    }
  }

  private crouch(host: MovementHost): void {
    if (this.canCrouch) {
      const isDownPressed: boolean = host.input.justPressed(ControllerKey.DOWN);

      const isUpPressed: boolean = host.input.up;

      if (isDownPressed && !this.isCrouch) {
        if (!host.isAimingDiagonal || host.previousFacing.y === host.facing.y) {
          // DEVIATION 2
          if (
            host.isOnFloor() &&
            !this.isHanging &&
            !this.isAttachOnLadder &&
            !this.isClimbingLedge
          ) {
            this.isCrouch = true;
          }
        }
      } else if (isUpPressed && this.isCrouch) {
        this.isCrouch = false;
      }
    }

    this.canCrouch = true;
  }

  private climb(host: MovementHost, x: number, y: number): void {
    this.isClimbingLedge = true;
    // DEVIATION 6
    this.isCrouch = false;

    host.climb(x, y);
  }
}
