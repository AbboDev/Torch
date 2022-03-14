import { ControlScene } from 'Scenes/ControlScene';

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
