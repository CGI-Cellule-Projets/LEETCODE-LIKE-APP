function resolveApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001/api';
  }

  const queryApiUrl = new URLSearchParams(window.location.search).get('api');
  if (queryApiUrl && queryApiUrl.trim()) {
    return queryApiUrl.trim().replace(/\/$/, '');
  }

  if (window.location.protocol === 'file:') {
    return 'http://localhost:3001/api';
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }

  return `${window.location.origin.replace(/\/$/, '')}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

// Local storage token retrieval helper
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };
  
export async function getContestsAdmin() {
    const response = await fetch(`${API_BASE_URL}/contests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch contests');
    }
  
    // The API returns { upcoming: [], active: [], past: [] }
    // We will artificially flatten it for the unified admin tracking table 
    // and append a "status" property so the admin can identify it easily.
    const flattenedList = [
      ...data.data.active.map(c => ({...c, status: 'Active'})),
      ...data.data.upcoming.map(c => ({...c, status: 'Upcoming'})),
      ...data.data.past.map(c => ({...c, status: 'Past'})),
    ];
  
    return flattenedList;
  }
  
export async function createContest(contestPayload, problemMappingsPayload) {
    // 1. Create Contest Header
    const contestRes = await fetch(`${API_BASE_URL}/admin/contests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contestPayload)
    });
  
    const contestData = await contestRes.json();
    if (!contestRes.ok || !contestData.success) {
      throw new Error(contestData.message || 'Failed to create contest');
    }
  
    const newContestId = contestData.data.contest_id;
  
    // 2. Hydrate Problems Mapping
    const mappingRes = await fetch(`${API_BASE_URL}/admin/contests/${newContestId}/problems`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(problemMappingsPayload)
    });
  
    const mappingData = await mappingRes.json();
    if (!mappingRes.ok || !mappingData.success) {
      throw new Error(mappingData.message || 'Failed to assign problems to contest');
    }
  
    return true;
  }
