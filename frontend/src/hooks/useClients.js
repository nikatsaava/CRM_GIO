import { useState, useEffect, useCallback } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../api/clients';

export function useClients(search = '') {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getClients(search || undefined);
      setClients(data);
    } catch {}
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data) => { const r = await createClient(data); await fetch(); return r.data; };
  const update = async (id, data) => { const r = await updateClient(id, data); await fetch(); return r.data; };
  const remove = async (id) => { await deleteClient(id); await fetch(); };

  return { clients, loading, refetch: fetch, create, update, remove };
}
