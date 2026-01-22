import { useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';

export function useOfflineCache<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    get<T>(key).then((cached) => {
      if (cached !== undefined) {
        setValue(cached);
      }
      setIsLoading(false);
    });
  }, [key]);

  const updateValue = async (newValue: T) => {
    setValue(newValue);
    await set(key, newValue);
  };

  const clearCache = async () => {
    setValue(initialValue);
    await del(key);
  };

  return { value, updateValue, clearCache, isLoading };
}
