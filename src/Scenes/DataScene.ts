import { ContinuousScene } from 'Scenes/ContinuousScene';

export abstract class DataScene extends ContinuousScene {
  public create(): void {
    super.create();

    this.registry.events
      .on('setdata', (parent: any, key: string, data: any) => {
        this.updateData(parent, key, data);
      })
      .on('changedata', (parent: any, key: string, data: any) => {
        this.updateData(parent, key, data);
      });
  }

  protected abstract updateData(parent: any, key: string, data: any): void;
}
