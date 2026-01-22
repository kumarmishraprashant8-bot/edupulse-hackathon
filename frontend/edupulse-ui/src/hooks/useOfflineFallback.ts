import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

const MOCK_MODE_KEY = 'edupulse-mock-mode';
const FAILURE_COUNT_KEY = 'edupulse-failure-count';
const MAX_FAILURES = 2;

export interface OfflineFallbackState {
  isMockMode: boolean;
  failureCount: number;
  enableMockMode: () => void;
  disableMockMode: () => void;
  recordFailure: () => void;
  recordSuccess: () => void;
}

export function useOfflineFallback(): OfflineFallbackState {
  const [isMockMode, setIsMockMode] = useState(false);
  const [failureCount, setFailureCount] = useState(0);

  // Load state from IndexedDB on mount
  useEffect(() => {
    Promise.all([
      get<boolean>(MOCK_MODE_KEY),
      get<number>(FAILURE_COUNT_KEY),
    ]).then(([mockMode, count]) => {
      if (mockMode !== undefined) {
        setIsMockMode(mockMode);
      }
      if (count !== undefined) {
        setFailureCount(count);
      }
    });
  }, []);

  const enableMockMode = useCallback(async () => {
    setIsMockMode(true);
    await set(MOCK_MODE_KEY, true);
  }, []);

  const disableMockMode = useCallback(async () => {
    setIsMockMode(false);
    setFailureCount(0);
    await set(MOCK_MODE_KEY, false);
    await set(FAILURE_COUNT_KEY, 0);
  }, []);

  const recordFailure = useCallback(async () => {
    const newCount = failureCount + 1;
    setFailureCount(newCount);
    await set(FAILURE_COUNT_KEY, newCount);

    // Auto-enable mock mode after MAX_FAILURES consecutive failures
    if (newCount >= MAX_FAILURES && !isMockMode) {
      await enableMockMode();
    }
  }, [failureCount, isMockMode, enableMockMode]);

  const recordSuccess = useCallback(async () => {
    // Reset failure count on success
    if (failureCount > 0) {
      setFailureCount(0);
      await set(FAILURE_COUNT_KEY, 0);
    }
    // Optionally auto-disable mock mode on success (uncomment if desired)
    // if (isMockMode) {
    //   await disableMockMode();
    // }
  }, [failureCount]);

  return {
    isMockMode,
    failureCount,
    enableMockMode,
    disableMockMode,
    recordFailure,
    recordSuccess,
  };
}

