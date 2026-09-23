/**
 * TraceGuard AI API Service Client
 * Centralized communication layer with FastAPI backend.
 */

const CANDIDATE_PORTS = [8000, 8001, 8002, 8003];

let activeBaseUrl = (() => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  return `http://${host}:8000`;
})();

async function fetchJson(endpoint, options = {}) {
  const url = `${activeBaseUrl}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorDetail = errJson.detail;
        else if (errJson.error) errorDetail = errJson.error;
      } catch (e) {
        // use default errorDetail
      }
      throw new Error(errorDetail);
    }

    return await res.json();
  } catch (err) {
    // If connection refused, attempt discovery across candidate ports for /health endpoint
    if (endpoint === '/health' && typeof window !== 'undefined') {
      const host = window.location.hostname || '127.0.0.1';
      for (const port of CANDIDATE_PORTS) {
        try {
          const testUrl = `http://${host}:${port}/health`;
          const testRes = await fetch(testUrl, { signal: AbortSignal.timeout(600) });
          if (testRes.ok) {
            activeBaseUrl = `http://${host}:${port}`;
            return await testRes.json();
          }
        } catch (probeErr) {
          // continue probe
        }
      }
    }
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  async getHealth() {
    return fetchJson('/health');
  },

  // TraceGuard Pipeline Execution
  async executePipeline(payload) {
    return fetchJson('/pipeline/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Ingest Source Text
  async ingestTextInvoice(payload) {
    return fetchJson('/sources/invoice/text', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Vendor Master Registry
  async getVendors() {
    return fetchJson('/business/vendors');
  },

  // Vendor Business Verification
  async verifyVendor(payload) {
    return fetchJson('/business/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Audit Events
  async getAuditTrail(limit = 30) {
    return fetchJson(`/audit?limit=${limit}`);
  },

  async getAuditEvent(eventId) {
    return fetchJson(`/audit/${eventId}`);
  },

  // Universal Content Ingestion & Pipeline (Phase 8)
  async getSupportedFormats() {
    return fetchJson('/sources/supported-formats');
  },

  async uploadUniversalSource(file) {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${activeBaseUrl}/sources/upload`;
    
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorDetail = errJson.detail;
      } catch (e) {}
      throw new Error(errorDetail);
    }
    return await res.json();
  },

  async getSource(sourceId) {
    return fetchJson(`/sources/${sourceId}`);
  },

  async executeUniversalPipeline(payload) {
    return fetchJson('/sources/analyze-pipeline', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Evaluation & Benchmark
  async getScenarios() {
    return fetchJson('/evaluation/scenarios');
  },

  async runScenario(scenarioId) {
    return fetchJson(`/evaluation/run/${scenarioId}`, {
      method: 'POST',
    });
  },

  async runFullEvaluation() {
    return fetchJson('/evaluation/run', {
      method: 'POST',
    });
  },

  async getEvaluationReport() {
    return fetchJson('/evaluation/report');
  },
};
