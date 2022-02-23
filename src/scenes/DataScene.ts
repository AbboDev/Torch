import { ControlScene } from 'Scenes/ControlScene';

export abstract class DataScene extends ControlScene {
  public create(): void {
    super.create();

    this.registry.events
      .on('setdata', this.updateData.bind(this))
      .on('changedata', this.updateData.bind(this));
  }

  protected updateData(parent: any, key: string, data: any): void {}
}
