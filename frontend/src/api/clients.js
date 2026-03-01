import api from './axios';

export const getClients = (search) =>
  api.get('/clients', {
    params: { search, deleted: 'active' }
  });

export const getDeletedClients = (search) =>
  api.get('/clients', {
    params: { search, deleted: 'deleted' }
  });

export const getClient = (id) =>
  api.get(`/clients/${id}`);

export const createClient = (data) =>
  api.post('/clients', data);

export const updateClient = (id, data) =>
  api.patch(`/clients/${id}`, data);

export const deleteClient = (id) =>
  api.delete(`/clients/${id}`);

export const restoreClient = (id) =>
  api.patch(`/clients/${id}/restore`);

export const hardDeleteClient = (id) =>
  api.delete(`/clients/${id}/hard`);