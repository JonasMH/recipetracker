import { type DependencyList, useState, useCallback, useEffect } from "react";

export function useAsync<T>(
  callback: () => Promise<T>,
  deps?: DependencyList
): { loading: boolean; data: T | null; error: Error | null } {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const callbackMemoized = useCallback(() => {
    setLoading(true);
    setError(undefined!);
    setData(undefined!);
    callback()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, deps ?? []);

  useEffect(() => callbackMemoized(), [callbackMemoized]);

  return { loading, data, error };
}

export function useLocalState<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  });

  const setLocalStorageValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    [key]
  );

  return [value, setLocalStorageValue];
}
