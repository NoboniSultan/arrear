import { useCallback, useEffect, useState } from 'react';
import { fetchRule } from '../services/api';

export function useRule(id) {
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchRule(id)
      .then(setRule)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { rule, loading, error, refetch: load };
}
