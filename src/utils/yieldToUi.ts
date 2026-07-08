type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type RequestIdleCallbackLike = (
  callback: (deadline: IdleDeadlineLike) => void,
  opts?: { timeout?: number },
) => number;

const idleApi = globalThis as typeof globalThis & {
  requestIdleCallback?: RequestIdleCallbackLike;
};

const requestIdle: RequestIdleCallbackLike =
  typeof idleApi.requestIdleCallback === 'function'
    ? idleApi.requestIdleCallback.bind(globalThis)
    : callback =>
        setTimeout(() => {
          callback({
            didTimeout: true,
            timeRemaining: () => 0,
          });
        }, 0);

export function yieldToUi(timeout = 50): Promise<void> {
  return new Promise(resolve => {
    requestIdle(() => resolve(), { timeout });
  });
}
