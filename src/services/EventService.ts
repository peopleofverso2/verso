type EventCallback = (data: any) => void;

export class EventService {
  private static instance: EventService;
  private listeners: Map<string, Set<EventCallback>>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  public off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  public emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  public clear(): void {
    this.listeners.clear();
  }
}
