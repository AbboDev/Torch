/**
 * A tiny typed event emitter with no dependency on Phaser, so the game state
 * can live (and be tested) outside of any scene.
 *
 * `on` returns an unsubscribe function: call it when the listener owner goes
 * away (scene shutdown, destroyed object, ...) to avoid leaks.
 */
export class Emitter<Events extends Record<string, unknown[]>> {
  private listeners = new Map<keyof Events, Set<(...args: any[]) => void>>();

  public on<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }

    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  public emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    // Copy so a listener can safely unsubscribe while the event is dispatched
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener(...args);
    }
  }

  public listenerCount(event: keyof Events): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
