type Arguments<T> = [T] extends [(...args: infer U) => any]
  ? U
  : [T] extends [void]
  ? []
  : [T]

type EventShape = Record<string | symbol, (...args: any[]) => void>
export declare class EventEmitter<Events extends EventShape = EventShape>
  implements NodeJS.EventEmitter {
  addListener<E extends keyof Events>(event: E, listener: Events[E]): this
  on<E extends keyof Events>(event: E, listener: Events[E]): this
  once<E extends keyof Events>(event: E, listener: Events[E]): this
  prependListener<E extends keyof Events>(event: E, listener: Events[E]): this
  prependOnceListener<E extends keyof Events>(
    event: E,
    listener: Events[E],
  ): this
  off<E extends keyof Events>(event: E, listener: Events[E]): this
  removeAllListeners<E extends keyof Events>(event?: E): this
  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this
  emit<E extends keyof Events>(event: E, ...args: Arguments<Events[E]>): boolean
  eventNames<E extends keyof Events>(): E[]
  listeners<E extends keyof Events>(event: E): Events[E][]
  rawListeners<E extends keyof Events>(event: E): Events[E][]
  listenerCount<E extends keyof Events>(event: E): number
  getMaxListeners(): number
  setMaxListeners(maxListeners: number): this
}
