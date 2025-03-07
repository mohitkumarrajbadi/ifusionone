// EventBus.ts

export type Callback<T = any> = (data: T) => void;

class EventBus {
  private events: Map<string, Callback[]> = new Map();

  /**
   * Subscribe to an event with a callback.
   * @param event - The event name.
   * @param callback - The function to call when the event is emitted.
   */
  public on<T = any>(event: string, callback: Callback<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    console.log(`[LISTEN] Listening to event: ${event}`);
  }

  /**
   * Unsubscribe from an event.
   * @param event - The event name.
   * @param callback - (Optional) Specific callback to remove. If omitted, removes all listeners for the event.
   */
  public off<T = any>(event: string, callback?: Callback<T>): void {
    if (!this.events.has(event)) return;

    if (callback) {
      const updatedCallbacks = this.events.get(event)!.filter(cb => cb !== callback);
      if (updatedCallbacks.length) {
        this.events.set(event, updatedCallbacks);
      } else {
        this.events.delete(event);
      }
    } else {
      // Remove all callbacks for the event.
      this.events.delete(event);
    }
    console.log(`[UNLISTEN] Removed listener(s) for event: ${event}`);
  }

  /**
   * Emit an event with data.
   * @param event - The event name.
   * @param data - Data to pass to the event listeners.
   */
  public emit<T = any>(event: string, data: T): void {
    console.log(`[EVENT] ${event} emitted with:`, data);
    if (!this.events.has(event)) return;
    // Using a shallow copy of the callbacks to avoid mutation issues if a callback unsubscribes itself.
    for (const callback of [...this.events.get(event)!]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[ERROR] in handler for event "${event}":`, error);
      }
    }
  }

  /**
   * Subscribe to an event with a callback that is invoked only once.
   * @param event - The event name.
   * @param callback - The function to call once the event is emitted.
   */
  public once<T = any>(event: string, callback: Callback<T>): void {
    const onceCallback: Callback<T> = (data: T) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
}

export default new EventBus();
