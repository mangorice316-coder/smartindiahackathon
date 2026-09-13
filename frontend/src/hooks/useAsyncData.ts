import { useState, useEffect, useCallback, useRef } from 'react';

export type AsyncDataStatus = 'idle' | 'loading' | 'success' | 'refreshing' | 'empty' | 'error' | 'stale';

export interface AsyncDataState<T> {
  data: T | null;
  status: AsyncDataStatus;
  error: Error | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isEmpty: boolean;
  isError: boolean;
  isSuccess: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
}

export interface UseAsyncDataOptions<T> {
  initialData?: T | null;
  autoFetch?: boolean;
  staleTime?: number; // Milliseconds before data is marked stale
  isEmptyPredicate?: (data: T) => boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

export interface UseAsyncDataReturn<T> extends AsyncDataState<T> {
  execute: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

/**
 * Production-grade standardized 7-state data fetching hook.
 * Implements Section 17 & 18 of the Master UI Rebuild Specification.
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    initialData = null,
    autoFetch = true,
    staleTime = 60000, // 1 minute default
    isEmptyPredicate = (d: T) => Array.isArray(d) && d.length === 0,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [status, setStatus] = useState<AsyncDataStatus>(initialData ? 'success' : 'idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);

  const isMountedRef = useRef(true);
  const activeFetchIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Stale status timer
  useEffect(() => {
    if (!lastUpdated || staleTime <= 0) return;

    const timer = setTimeout(() => {
      if (isMountedRef.current && status === 'success') {
        setStatus('stale');
      }
    }, staleTime);

    return () => clearTimeout(timer);
  }, [lastUpdated, staleTime, status]);

  const execute = useCallback(
    async (isBackgroundRefresh = false): Promise<T | null> => {
      const fetchId = ++activeFetchIdRef.current;

      if (isBackgroundRefresh && data !== null) {
        setStatus('refreshing');
      } else {
        setStatus('loading');
      }
      setError(null);

      try {
        const result = await fetchFn();

        if (!isMountedRef.current || fetchId !== activeFetchIdRef.current) {
          return null;
        }

        const empty = isEmptyPredicate(result);
        setData(result);
        setStatus(empty ? 'empty' : 'success');
        setLastUpdated(new Date());

        if (onSuccess) onSuccess(result);
        return result;
      } catch (err: any) {
        if (!isMountedRef.current || fetchId !== activeFetchIdRef.current) {
          return null;
        }

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setStatus('error');

        if (onError) onError(errorObj);
        return null;
      }
    },
    [fetchFn, data, isEmptyPredicate, onError, onSuccess]
  );

  const refresh = useCallback(() => execute(true), [execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setStatus(initialData ? 'success' : 'idle');
    setError(null);
    setLastUpdated(initialData ? new Date() : null);
  }, [initialData]);

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, [autoFetch]);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isRefreshing: status === 'refreshing',
    isEmpty: status === 'empty',
    isError: status === 'error',
    isSuccess: status === 'success',
    isStale: status === 'stale',
    lastUpdated,
    execute,
    refresh,
    setData,
    reset,
  };
}
