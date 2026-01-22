import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TeacherQueryRequest {
  phone: string;
  cluster: string;
  topic: string;
  text: string;
  consent_given: boolean;
}

export interface TeacherQueryResponse {
  id: string;
  advice: string;
  module_sample_link: string;
  consent_required: boolean;
}

export interface AggregateResponse {
  total_queries: number;
  by_topic: Record<string, number>;
  by_cluster: Record<string, number>;
  sample_queries: Array<{
    id: string;
    cluster_id: string;
    topic_tag: string;
    narrative_text: string;
    created_at: string;
    resolved: boolean;
    flagged_for_crp: boolean;
  }>;
}

export interface ModuleGenerateRequest {
  cluster: string;
  topic: string;
  template?: string;
}

export interface ModuleGenerateResponse {
  module_id: string;
  pptx_link: string;
  title: string;
}

export interface LFAExportRequest {
  title: string;
  problem_statement: string;
  student_change: string;
  stakeholders: string[];
  practice_changes: string[];
  indicators: string[];
}

export interface LFAExportResponse {
  export_url: string;
  lfa_id: string;
}

export const teacherApi = {
  submitQuery: async (data: TeacherQueryRequest): Promise<TeacherQueryResponse> => {
    const response = await api.post<TeacherQueryResponse>('/api/teacher/query', data);
    return response.data;
  },
  
  getSampleResponse: async (topic: string = 'subtraction-borrowing'): Promise<TeacherQueryResponse> => {
    const response = await api.get<TeacherQueryResponse>(`/api/teacher/sample-response?topic=${topic}`);
    return response.data;
  },
};

export const dietApi = {
  getAggregate: async (params?: {
    cluster?: string;
    topic?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<AggregateResponse> => {
    const response = await api.get<AggregateResponse>('/api/diet/aggregate', { params });
    return response.data;
  },
  
  generateModule: async (data: ModuleGenerateRequest): Promise<ModuleGenerateResponse> => {
    const response = await api.post<ModuleGenerateResponse>('/api/diet/generate-module', data);
    return response.data;
  },
};

export const lfaApi = {
  exportLFA: async (data: LFAExportRequest): Promise<LFAExportResponse> => {
    const response = await api.post<LFAExportResponse>('/api/lfa/export', data);
    return response.data;
  },
};

export default api;
