import { ControlScene } from 'Scenes';

export class Controller extends ControlScene {
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
