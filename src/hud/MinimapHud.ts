import * as Phaser from "phaser";
import { MINIMAP } from "@/config/minimap";
import type { ExploredGrid } from "@/world/explored";
import type { MinimapLive } from "@/world/minimapTracker";
import {
  getCellColor,
  getMarkers,
  getWindowOrigin,
  renderCells,
  toRuns,
} from "@/world/minimapView";
import { getViewCells } from "@/world/minimapVisibility";

/**
 * The minimap in the HUD: a frame with a part of the map, and the Player always
 * in the middle of it. What it shows is worked out in `world/minimapView`; this
 * only draws it.
 */
export class MinimapHud {
  private readonly frame: Phaser.GameObjects.Graphics;

  private readonly cells: Phaser.GameObjects.Graphics;

  private readonly markers: Phaser.GameObjects.Graphics;

  /** What the cells were drawn for: they are drawn again only when it changes */
  private drawnFor = "";

  public constructor(scene: Phaser.Scene) {
    const { window, scale, x, y } = MINIMAP;
    const width = window.cols * scale;
    const height = window.rows * scale;

    this.frame = scene.add
      .graphics({ x, y })
      .fillStyle(0x000000, 0.6)
      .fillRect(0, 0, width, height)
      .lineStyle(1, 0xffffff, 0.9)
      .strokeRect(-0.5, -0.5, width + 1, height + 1);
    this.cells = scene.add.graphics({ x, y });
    this.markers = scene.add.graphics({ x, y });
  }

  /**
   * @param live     What the game says now, or nothing if there is no map yet
   * @param explored What the Player has seen of the map
   * @param time     The time of the game, in milliseconds
   */
  public update(
    live: MinimapLive | undefined,
    explored: ExploredGrid | undefined,
    time: number
  ): void {
    const isShown = live !== undefined && explored !== undefined;

    this.frame.setVisible(isShown);
    this.cells.setVisible(isShown);
    this.markers.setVisible(isShown);

    if (!live || !explored) {
      this.drawnFor = "";

      return;
    }

    const { window, scale, markerSize, blinkMs } = MINIMAP;
    const frame = {
      player: live.player,
      visible: live.view,
      torchRadius: live.torchRadius,
    };
    const { left, top } = getWindowOrigin(live.map, live.player, window);
    const lit = getViewCells(live.map, live.view);

    const key = [
      live.mapId,
      left,
      top,
      lit.col0,
      lit.row0,
      lit.col1,
      lit.row1,
      // the light of the torch: it decides what is seen in a dark room
      Math.round(live.torchRadius),
      explored.revision,
    ].join(",");

    if (key !== this.drawnFor) {
      this.drawnFor = key;
      this.cells.clear();

      const cells = renderCells(live.map, explored, frame, window);

      for (const run of toRuns(cells, window.cols, window.rows)) {
        const { color, alpha } = getCellColor(run.cell);

        this.cells
          .fillStyle(color, alpha)
          .fillRect(run.col * scale, run.row * scale, run.length * scale, scale);
      }
    }

    this.markers.clear();

    const blink = Math.floor(time / blinkMs) % 2 === 1;
    const edge = 1;

    const markers = getMarkers(
      live.map,
      explored,
      frame,
      window,
      blink,
      live.enemies
    );

    for (const marker of markers) {
      const x = (marker.col + 0.5) * scale - markerSize / 2;
      const y = (marker.row + 0.5) * scale - markerSize / 2;

      this.markers
        .fillStyle(0x000000, 1)
        .fillRect(
          x - edge,
          y - edge,
          markerSize + edge * 2,
          markerSize + edge * 2
        )
        .fillStyle(marker.color, 1)
        .fillRect(x, y, markerSize, markerSize);
    }
  }
}
