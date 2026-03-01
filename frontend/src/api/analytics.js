import api from './axios';
export const getAnalytics = () => api.get('/analytics/summary');
export const getDashboard = (params) =>
    api.get('/analytics/summary', { params });