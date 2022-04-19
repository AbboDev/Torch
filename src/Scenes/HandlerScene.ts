import { ContinuousScene } from 'Scenes/ContinuousScene';

export class HandlerScene extends ContinuousScene {
  public constructor() {
    super({
      active: false,
      visible: false,
      key: 'gateway'
    });
  }

  public create(): void {
    super.create();
  }
}
