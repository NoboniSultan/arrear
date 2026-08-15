import { useCallback, useEffect, useState } from 'react';
import { fetchFlaggedItems } from '../services/api';

const EMPTY_RESULT = { items: [], total: 0, openCount: 0, openValue: 0, page: 1, pageSize: 10 };

export function useFlaggedItems(params) {
  const [data, setData] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFlaggedItems(JSON.parse(paramsKey))
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, error, refetch: load };
}
