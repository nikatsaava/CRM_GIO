import { useState, useEffect, useCallback } from 'react';
import { getOrders, createOrder, updateOrder, deleteOrder } from '../api/orders';

export function useOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getOrders(filters);
      setOrders(data);
    } catch (e) {
      setError(e.response?.data?.message || 'შეცდომა');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data) => { const r = await createOrder(data); await fetch(); return r.data; };
  const update = async (id, data) => { const r = await updateOrder(id, data); await fetch(); return r.data; };
  const remove = async (id) => { await deleteOrder(id); await fetch(); };

  return { orders, loading, error, refetch: fetch, create, update, remove };
}
