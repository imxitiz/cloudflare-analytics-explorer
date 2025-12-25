// API Client for Cloudflare Analytics Engine

const API_BASE = '/api';

export interface Dataset {
  id: string;
  name: string;
}

export interface DatasetColumn {
  name: string;
  type: string;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  meta: { name: string; type: string }[];
  rowCount: number;
  totalRows: number;
  error?: string;
  message?: string;
}

export interface ConfigStatus {
  configured: boolean;
  hasAccountId: boolean;
  hasApiToken: boolean;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data as T;
  }

  // Check if API is configured
  async getConfigStatus(): Promise<ConfigStatus> {
    return this.request<ConfigStatus>('/config/status');
  }

  // List all datasets from Analytics Engine
  async getDatasets(): Promise<Dataset[]> {
    const result = await this.request<{ datasets: Dataset[] }>('/datasets');
    return result.datasets;
  }

  // Get schema for a specific dataset
  async getDatasetSchema(datasetId: string): Promise<DatasetColumn[]> {
    const result = await this.request<{
      datasetId: string;
      columns: DatasetColumn[];
    }>(`/datasets/${encodeURIComponent(datasetId)}/schema`);
    return result.columns;
  }

  // Execute a SQL query
  async executeQuery(
    query: string,
    params?: Record<string, string | number>
  ): Promise<QueryResult> {
    return this.request<QueryResult>('/query', {
      method: 'POST',
      body: JSON.stringify({ query, params }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiClient = new ApiClient();
