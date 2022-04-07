import { ContinuousScene } from 'Scenes/ContinuousScene';

export class HandlerScene extends ContinuousScene {
  public constructor() {
    super({
      active: false,
      visible: false,
      key: 'controller'
    });
  }

  public create(): void {
    super.create();
  }
}
