type Events = Record<string | symbol, (...args: any[]) => void>

export declare class EventEmitter<E extends Events = Events>
  implements NodeJS.EventEmitter {
  addListener<K extends keyof E>(event: K, listener: E[K]): this
  on<K extends keyof E>(event: K, listener: E[K]): this
  once<K extends keyof E>(event: K, listener: E[K]): this
  prependListener<K extends keyof E>(event: K, listener: E[K]): this
  prependOnceListener<K extends keyof E>(event: K, listener: E[K]): this
  off<K extends keyof E>(event: K, listener: E[K]): this
  removeAllListeners<K extends keyof E>(event?: K): this
  removeListener<K extends keyof E>(event: K, listener: E[K]): this
  emit<K extends keyof E>(event: K, ...args: Parameters<E[K]>): boolean
  eventNames<K extends keyof E>(): K[]
  listeners<K extends keyof E>(event: K): E[K][]
  rawListeners<K extends keyof E>(event: K): E[K][]
  listenerCount<K extends keyof E>(event: K): number
  getMaxListeners(): number
  setMaxListeners(maxListeners: number): this
}
