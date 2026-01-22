/**
 * API service for communicating with backend
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Teacher endpoints
export const submitTeacherQuery = async (queryData) => {
  const response = await api.post('/teacher/query', queryData);
  return response.data;
};

export const getTeacherQuery = async (queryId) => {
  const response = await api.get(`/teacher/query/${queryId}`);
  return response.data;
};

// DIET endpoints
export const getAggregatedData = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.cluster) params.append('cluster', filters.cluster);
  if (filters.topic) params.append('topic', filters.topic);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const response = await api.get(`/diet/aggregate?${params.toString()}`);
  return response.data;
};

export const generateModule = async (moduleData) => {
  const response = await api.post('/diet/generate-module', moduleData);
  return response.data;
};

// LFA endpoints
export const exportLFA = async (lfaData) => {
  const response = await api.post('/lfa/export', lfaData);
  return response.data;
};

export default api;