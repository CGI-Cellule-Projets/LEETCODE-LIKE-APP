// Local storage token retrieval helper
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };
  
  export async function getContestsAdmin() {
    const response = await fetch('http://localhost:3000/api/contests', {
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
    const contestRes = await fetch('http://localhost:3000/api/admin/contests', {
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
    const mappingRes = await fetch(`http://localhost:3000/api/admin/contests/${newContestId}/problems`, {
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
