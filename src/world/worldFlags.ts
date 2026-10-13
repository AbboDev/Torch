/**
 * The ids of the things which change in the world for good, stored as flags
 * in the game state (see `GameState.setFlag`). Every id starts with the key
 * of the map, so two maps can have a block in the same place.
 */

/** A block of the "breakables" layer which has been destroyed */
export function breakableFlag(
  mapKey: string,
  column: number,
  row: number
): string {
  return `${mapKey}:breakable:${column},${row}`;
}
