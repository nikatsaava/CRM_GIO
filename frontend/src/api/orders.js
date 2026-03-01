import api from './axios';

export const getOrders = (params) =>
  api.get('/orders', { params });

export const getOrder        = (id)       => api.get(`/orders/${id}`);
export const getClientOrders = (clientId) => api.get(`/orders/client/${clientId}`);
export const createOrder     = (data)     => api.post('/orders', data);
export const updateOrder     = (id, data) => api.patch(`/orders/${id}`, data);
export const updateStatus    = (id, status) =>
  api.patch(`/orders/${id}`, { status });

export const deleteOrder     = (id) => api.delete(`/orders/${id}`);
export const restoreOrder    = (id) => api.patch(`/orders/${id}/restore`);
export const hardDeleteOrder = (id) => api.delete(`/orders/${id}/hard`);
export const getOrdersByClient = (clientId) =>
  api.get(`/orders/by-client/${clientId}`);

export const exportOrders = () =>
    api.get('/orders/export', {
      responseType: 'blob', // ВАЖНО!
    });