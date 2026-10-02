import { ContinuousScene } from "@/scenes/ContinuousScene";

export class HandlerScene extends ContinuousScene {
  public constructor() {
    super({
      active: false,
      visible: false,
      key: "gateway",
    });
  }
}
