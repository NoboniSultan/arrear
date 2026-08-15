import { useCallback, useEffect, useState } from 'react';
import { fetchFlaggedItem } from '../services/api';

export function useFlaggedItem(id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchFlaggedItem(id)
      .then(setItem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { item, loading, error, refetch: load };
}
