import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const DEMO_SALT = import.meta.env.VITE_DEMO_SALT || 'edupulse-demo-salt-2026';

// Phone hashing utility (SHA256)
async function hashPhone(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phone + DEMO_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Response wrapper type
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
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

// Helper to parse validation errors
function parseValidationError(error: AxiosError): string {
  if (error.response?.status === 422) {
    const detail = error.response.data as any;
    if (detail?.error_message) {
      return detail.error_message;
    }
    if (detail?.detail) {
      if (Array.isArray(detail.detail)) {
        const messages = detail.detail.map((d: any) => {
          if (typeof d === 'string') return d;
          if (d.msg) return d.msg;
          return String(d);
        });
        // Friendly message for 422
        if (messages.some((m: string) => m.includes('text') || m.includes('cluster'))) {
          return "We need a little more info — please add the subject or a short example.";
        }
        return messages.join(', ');
      }
      if (typeof detail.detail === 'string') {
        return detail.detail;
      }
    }
  }
  if (error.response?.status === 400) {
    const data = error.response.data as any;
    if (data?.error_message) return data.error_message;
    if (data?.detail) return String(data.detail);
  }
  if (error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as any;
    if (data.message) return data.message;
    if (data.detail) return String(data.detail);
  }
  // Network errors
  if (!error.response) {
    return 'Network error — cannot reach server';
  }
  return error.message || 'Request failed';
}

// Exponential backoff retry logic
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wrapper function with retry logic and exponential backoff
async function apiCall<T>(
  request: () => Promise<AxiosResponse<T>>,
  retries = 1,
  initialDelay = 500
): Promise<ApiResponse<T>> {
  try {
    const response = await request();
    return { ok: true, data: response.data };
  } catch (error) {
    const axiosError = error as AxiosError;
    
    // Retry on network errors or 502/503/504
    if (retries > 0 && (
      !axiosError.response || 
      axiosError.response?.status === 502 || 
      axiosError.response?.status === 503 ||
      axiosError.response?.status === 504
    )) {
      await sleep(initialDelay);
      return apiCall(request, retries - 1, initialDelay * 3); // Exponential backoff: 500ms → 1500ms
    }
    
    const errorMessage = parseValidationError(axiosError);
    return { ok: false, error: errorMessage };
  }
}

export interface TeacherQueryRequest {
  phone?: string;
  cluster?: string;
  topic?: string;
  text: string;
  attachment?: File;
  is_demo?: boolean;
  consent_given?: boolean;
}

export interface TeacherQueryResponse {
  id: string;
  advice: string;
  module_sample_link: string;
  consent_required: boolean;
}

export interface ModuleGenerateRequest {
  cluster: string;
  topic: string;
  template?: string;
  grade?: string;
  language?: string;
}

export interface ModuleGenerateResponse {
  module_id: string;
  pptx_link?: string;
  pptx_base64?: string;
  title: string;
  preview_url?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
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
  preview_url?: string;
}

export const teacherApi = {
  createTeacherQuery: async (payload: TeacherQueryRequest): Promise<ApiResponse<TeacherQueryResponse>> => {
    // Handle phone hashing
    let phoneToSend: string | undefined;
    if (payload.phone && payload.phone.trim() && !payload.is_demo) {
      phoneToSend = await hashPhone(payload.phone.trim());
    } else if (payload.is_demo) {
      phoneToSend = 'demo-000';
    }

    // Handle attachment upload (multipart)
    if (payload.attachment) {
      const formData = new FormData();
      formData.append('text', payload.text);
      if (payload.cluster) formData.append('cluster', payload.cluster);
      if (payload.topic) formData.append('topic', payload.topic);
      if (phoneToSend) formData.append('phone', phoneToSend);
      if (payload.is_demo) formData.append('is_demo', 'true');
      formData.append('attachment', payload.attachment);
      formData.append('consent_given', String(payload.consent_given ?? true));

      return apiCall(() => 
        api.post<TeacherQueryResponse>('/api/teacher/query', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    }

    // Regular JSON request
    return apiCall(() => api.post<TeacherQueryResponse>('/api/teacher/query', {
      phone: phoneToSend || '',
      cluster: payload.cluster || 'Default Cluster',
      topic: payload.topic || 'general',
      text: payload.text,
      is_demo: payload.is_demo || false,
      consent_given: payload.consent_given ?? true,
    }));
  },

  flagToCrp: async (queryId: string, reason: string): Promise<ApiResponse<{ success: boolean }>> => {
    return apiCall(() => api.post('/api/teacher/flag', {
      query_id: queryId,
      reason: reason,
    }));
  },
  
  getSampleResponse: async (topic: string = 'subtraction-borrowing'): Promise<ApiResponse<TeacherQueryResponse>> => {
    return apiCall(() => api.get<TeacherQueryResponse>(`/api/teacher/sample-response?topic=${topic}`));
  },
};

export const dietApi = {
  getAggregate: async (cluster?: string, topic?: string): Promise<ApiResponse<AggregateResponse>> => {
    const params: any = {};
    if (cluster) params.cluster = cluster;
    if (topic) params.topic = topic;
    return apiCall(() => api.get<AggregateResponse>('/api/diet/aggregate', { params }));
  },
  
  generateModule: async (payload: ModuleGenerateRequest): Promise<ApiResponse<ModuleGenerateResponse>> => {
    return apiCall(() => api.post<ModuleGenerateResponse>('/api/diet/generate-module', {
      cluster: payload.cluster,
      topic: payload.topic,
      template: payload.template || 'default',
      grade: payload.grade,
      language: payload.language,
    }));
  },
  
  downloadFile: async (url: string): Promise<Blob> => {
    const response = await axios.get(url, { responseType: 'blob', timeout: 30000 });
    return response.data;
  },
};

export const lfaApi = {
  exportLFA: async (data: LFAExportRequest): Promise<ApiResponse<LFAExportResponse>> => {
    return apiCall(() => api.post<LFAExportResponse>('/api/lfa/export', data));
  },
  
  downloadFile: async (url: string): Promise<Blob> => {
    const response = await axios.get(url, { responseType: 'blob' });
    return response.data;
  },
};

// Helper to trigger browser download
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to download from URL or base64
export async function downloadModule(
  response: ModuleGenerateResponse,
  filename?: string
): Promise<void> {
  if (response.pptx_base64) {
    // Decode base64
    const binaryString = atob(response.pptx_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    triggerDownload(blob, filename || `${response.title.replace(/\s+/g, '_')}.pptx`);
  } else if (response.pptx_link) {
    // Download from URL
    try {
      const blob = await dietApi.downloadFile(response.pptx_link);
      // Extract filename from Content-Disposition or URL
      const urlFilename = response.pptx_link.split('/').pop() || 'module.pptx';
      triggerDownload(blob, filename || urlFilename);
    } catch (error) {
      throw new Error('Failed to download module file');
    }
  } else {
    throw new Error('No download link or base64 data available');
  }
}

// Image compression utility (client-side)
export async function compressImage(file: File, maxSizeKB: number = 500, quality: number = 0.6): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions to reduce size
        const ratio = Math.sqrt((maxSizeKB * 1024) / file.size);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export default api;
