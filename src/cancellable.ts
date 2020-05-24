import { Interface } from 'readline'

export const cancelable = async <T extends any>(
  rl: Interface,
  promise: Promise<T>,
): Promise<[T, false] | [undefined, true]> => {
  return new Promise(async (resolve, reject) => {
    const cancel = () => resolve([undefined, true])
    const cleanup = () => rl.off('SIGINT', cancel)
    rl.once('SIGINT', cancel)
    promise.then(cleanup, cleanup)
    try {
      resolve([await promise, false])
    } catch (e) {
      reject(e)
    }
  })
}

export const canceled = async (
  ...params: Parameters<typeof cancelable>
): Promise<boolean> => {
  try {
    return (await cancelable(...params))[1]
  } catch {
    return false
  }
}
