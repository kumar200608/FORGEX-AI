/**
 * TrustGuard API Client
 * Connects to the TrustGuard Indirect Prompt Injection Firewall backend.
 * Uses Vite proxy in development or relative paths to preserve CORS-free connectivity.
 */

const BASE_URL = '';

/**
 * Check backend health status
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Health check failed with HTTP ${res.status}`);
    }
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message || 'Backend unreachable' };
  }
}

/**
 * Fetch all audit logs
 */
export async function fetchAuditLogs() {
  try {
    const res = await fetch(`${BASE_URL}/audit-logs`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Audit logs request failed with HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.logs)) {
      return { success: true, logs: data.logs };
    }
    return { success: false, logs: [], message: data.message || 'Failed to parse logs' };
  } catch (err) {
    return { success: false, logs: [], error: err.message || 'Network error fetching logs' };
  }
}

/**
 * Run Security Check on an action
 * @param {Object} payload
 * @param {string} payload.action - "SEND_EMAIL"
 * @param {string} payload.recipient
 * @param {string} payload.subject
 * @param {string} payload.body
 * @param {string} payload.source - "user" | "email" | "web" | "pdf" | "external_tool"
 * @param {string} payload.source_content
 * @param {string} payload.user_instruction
 */
export async function runSecurityCheck(payload) {
  try {
    const res = await fetch(`${BASE_URL}/security/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      let detailMsg = `HTTP Error ${res.status}`;
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          detailMsg = data.detail.map(d => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(', ');
        } else if (typeof data.detail === 'string') {
          detailMsg = data.detail;
        }
      }
      return { success: false, error: detailMsg, statusCode: res.status };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to connect to TrustGuard security firewall',
    };
  }
}

/**
 * Confirm or reject a pending security request
 * @param {string} requestId
 * @param {boolean} approved
 */
export async function confirmSecurityRequest(requestId, approved) {
  try {
    const url = `${BASE_URL}/security/confirm/${encodeURIComponent(requestId)}?approved=${approved ? 'true' : 'false'}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: (data && data.message) || `HTTP error ${res.status}`,
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to submit confirmation decision',
    };
  }
}
