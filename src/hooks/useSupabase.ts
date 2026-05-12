import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseTable<T>(table: string, options?: { orderBy?: string; ascending?: boolean }) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from(table).select('*');
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setData(data as T[]);
      setLoading(false);
    });
  }, [table]);

  return { data, loading, error };
}
