import { useCallback, useEffect, useState } from 'react';
import { fetchRules } from '../services/api';

export function useRules(params) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRules(JSON.parse(paramsKey))
      .then(setRules)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { rules, loading, error, refetch: load };
}
