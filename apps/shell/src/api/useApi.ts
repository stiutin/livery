import {useCallback, useEffect, useEffectEvent, useState} from 'react';

export type ApiState<T> =
  {status: 'loading'} | {status: 'error'; message: string} | {status: 'ready'; data: T; reload: () => void};

type Result<T> = {key: string; status: 'error'; message: string} | {key: string; status: 'ready'; data: T};

/**
 * Runs a request after render, again whenever `key` changes, and on `reload()`. Answers for an older key are
 * dropped, and until the answer for the current key arrives the state is `loading`.
 */
export function useApi<T>(key: string, load: () => Promise<T>): ApiState<T> {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);
  const run = useEffectEvent(load);
  const request = `${key}#${version}`;

  useEffect(() => {
    let current = true;
    run().then(
      (data) => {
        if (current) {
          setResult({key: request, status: 'ready', data});
        }
      },
      (error: unknown) => {
        if (current) {
          setResult({
            key: request,
            status: 'error',
            message: error instanceof Error ? error.message : 'Something went wrong.',
          });
        }
      }
    );
    return () => {
      current = false;
    };
  }, [request]);

  if (result?.key !== request) {
    // A reload keeps showing the previous data instead of flashing the loading state.
    return result?.status === 'ready' && result.key.startsWith(`${key}#`) ? {...result, reload} : {status: 'loading'};
  }
  return result.status === 'ready' ? {...result, reload} : result;
}
