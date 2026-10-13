import { describe, expect, it, vi } from "vitest";
import {
  DoorTrigger,
  LocalDoor,
  MapObject,
  findDoorAt,
  isLocalDoor,
  parseDoors,
} from "@/world/doors";
import {
  DOOR_FADE_IN,
  DOOR_FADE_OUT,
  DoorHost,
  DoorTransition,
} from "@/world/DoorTransition";

const door = (id: number, properties: MapObject["properties"], extra = {}) => ({
  id,
  type: "door",
  x: 100,
  y: 200,
  width: 16,
  height: 32,
  properties,
  ...extra,
});

const exit: MapObject = { id: 50, name: "lab_entrance", x: 640, y: 320 };

describe("parseDoors", () => {
  it("finds the doors and where they lead, by object id", () => {
    const doors = parseDoors([
      exit,
      door(7, [{ name: "target", value: 50 }]),
      { id: 8, type: "room" },
    ]);

    expect(doors).toEqual([
      {
        id: 7,
        x: 100,
        y: 200,
        width: 16,
        height: 32,
        target: { map: null, id: 50, x: 640, y: 320 },
        requiresUp: false,
      },
    ]);
  });

  it("also accepts the name of the target", () => {
    const doors = parseDoors([
      exit,
      door(7, [{ name: "target", value: "lab_entrance" }]),
    ]);

    expect(doors[0].target).toMatchObject({ map: null, id: 50 });
  });

  it("can ask for the Up button", () => {
    const doors = parseDoors([
      exit,
      door(7, [
        { name: "target", value: 50 },
        { name: "requiresUp", value: true },
      ]),
    ]);

    expect(doors[0].requiresUp).toBe(true);
  });

  it("ignores, with a warning, a door which can not work", () => {
    const warn = vi.fn();

    const doors = parseDoors(
      [
        exit,
        door(1, undefined),
        door(2, [{ name: "target", value: 999 }]),
        door(3, [{ name: "target", value: 3 }]),
        door(4, [{ name: "target", value: 50 }], { width: 0 }),
        door(5, [{ name: "target", value: "nowhere" }]),
        door(6, [{ name: "target", value: 50 }]),
      ],
      warn
    );

    expect(doors.map((d) => d.id)).toEqual([6]);
    expect(warn).toHaveBeenCalledTimes(5);
  });

  it("finds no doors in a map which has none", () => {
    expect(parseDoors([{ id: 1, type: "room" }])).toEqual([]);
  });
});

describe("doors to another map", () => {
  it("keep the map and the object they lead to", () => {
    const [byId, byName] = parseDoors([
      door(7, [
        { name: "target", value: 12 },
        { name: "targetMap", value: "cave" },
      ]),
      door(8, [
        { name: "target", value: "cave_entrance" },
        { name: "targetMap", value: " cave " },
      ]),
    ]);

    expect(byId.target).toEqual({ map: "cave", target: 12 });
    expect(byName.target).toEqual({ map: "cave", target: "cave_entrance" });
    expect(isLocalDoor(byId)).toBe(false);
  });

  it("need a target too, which is not looked for in this map", () => {
    const warn = vi.fn();

    const doors = parseDoors(
      [
        exit,
        door(7, [{ name: "targetMap", value: "cave" }]),
        // an id which exists in this map means nothing in the other one
        door(8, [
          { name: "target", value: 50 },
          { name: "targetMap", value: "cave" },
        ]),
      ],
      warn
    );

    expect(doors.map((d) => d.id)).toEqual([8]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("are the local ones when targetMap is empty", () => {
    const [local] = parseDoors([
      exit,
      door(7, [
        { name: "target", value: 50 },
        { name: "targetMap", value: "" },
      ]),
    ]);

    expect(isLocalDoor(local)).toBe(true);
  });
});

describe("findDoorAt", () => {
  const doors = parseDoors([
    exit,
    door(7, [{ name: "target", value: 50 }]),
  ]).filter(isLocalDoor);

  it("finds the door containing a point, borders: left and top in, right and bottom out", () => {
    expect(findDoorAt(doors, 100, 200)?.id).toBe(7);
    expect(findDoorAt(doors, 115.9, 231.9)?.id).toBe(7);
    expect(findDoorAt(doors, 116, 210)).toBeNull();
    expect(findDoorAt(doors, 110, 232)).toBeNull();
    expect(findDoorAt(doors, 0, 0)).toBeNull();
  });
});

describe("DoorTrigger", () => {
  const touch = parseDoors([exit, door(7, [{ name: "target", value: 50 }])])[0];
  const up = parseDoors([
    exit,
    door(8, [
      { name: "target", value: 50 },
      { name: "requiresUp", value: true },
    ]),
  ])[0];

  it("uses a door as soon as the Player touches it", () => {
    expect(new DoorTrigger().update(touch, false)).toBe(touch);
  });

  it("waits for the Up button when the door asks for it", () => {
    const trigger = new DoorTrigger();

    expect(trigger.update(up, false)).toBeNull();
    expect(trigger.update(up, true)).toBe(up);
  });

  it("does not use the same door again while the Player stays in it", () => {
    const trigger = new DoorTrigger();

    expect(trigger.update(touch, false)).toBe(touch);
    expect(trigger.update(touch, false)).toBeNull();
  });

  it("does not bounce back through the door it arrives in", () => {
    const trigger = new DoorTrigger();

    trigger.update(touch, false);
    // It appears inside another door: nothing happens...
    expect(trigger.update(up, true)).toBeNull();
    // ... until it has stepped out of every door
    trigger.update(null, false);
    expect(trigger.update(up, true)).toBe(up);
  });
});

describe("DoorTransition", () => {
  function setup() {
    const events: string[] = [];
    const pending: { name: string; done: () => void }[] = [];

    const host: DoorHost = {
      freeze: () => events.push("freeze"),
      unfreeze: () => events.push("unfreeze"),
      fadeOut: (duration, done) => {
        events.push(`fadeOut ${duration}`);
        pending.push({ name: "fadeOut", done });
      },
      fadeIn: (duration, done) => {
        events.push(`fadeIn ${duration}`);
        pending.push({ name: "fadeIn", done });
      },
      enter: (target) => events.push(`enter ${target.x},${target.y}`),
    };

    return { events, pending, transition: new DoorTransition(host) };
  }

  const [door] = parseDoors([
    exit,
    {
      id: 7,
      type: "door",
      x: 0,
      y: 0,
      width: 16,
      height: 32,
      properties: [{ name: "target", value: 50 }],
    },
  ]).filter(isLocalDoor);

  it("fades out, enters at the target, fades in and gives back the control", () => {
    const { events, pending, transition } = setup();

    expect(transition.start(door)).toBe(true);
    expect(events).toEqual(["freeze", `fadeOut ${DOOR_FADE_OUT}`]);

    pending.shift()!.done();
    expect(events.slice(2)).toEqual([
      "enter 640,320",
      `fadeIn ${DOOR_FADE_IN}`,
    ]);

    pending.shift()!.done();
    expect(events.at(-1)).toBe("unfreeze");
    expect(transition.isRunning).toBe(false);
  });

  it("does not start twice", () => {
    const { events, transition } = setup();

    transition.start(door);

    expect(transition.start(door)).toBe(false);
    expect(events.filter((event) => event === "freeze")).toHaveLength(1);
  });
});
