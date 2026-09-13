import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncData } from '../../src/hooks/useAsyncData';

describe('useAsyncData - Standardized 7-State Data Fetching', () => {
  it('should start in loading state when autoFetch is true and resolve to success', async () => {
    const mockData = { id: 1, name: 'Wayanad Zone' };
    const fetchFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsyncData(fetchFn, { autoFetch: true }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBe('loading');

    // Wait for resolution
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should transition to error state when fetch fails', async () => {
    const errorMsg = 'Failed to fetch telemetry';
    const fetchFn = vi.fn().mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useAsyncData(fetchFn, { autoFetch: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe(errorMsg);
  });

  it('should detect empty state using predicate', async () => {
    const fetchFn = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(() =>
      useAsyncData<string[]>(fetchFn, {
        autoFetch: true,
        isEmptyPredicate: (data) => data.length === 0,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.isEmpty).toBe(true);
  });
});
