import { getAuthHeaders, requestJson } from './apiClient';
  
export async function getContestsAdmin() {
    const data = await requestJson('/contests', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  
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
    const contestData = await requestJson('/admin/contests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contestPayload)
    });
  
    const newContestId = contestData.data.contest_id;
  
    await requestJson(`/admin/contests/${newContestId}/problems`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(problemMappingsPayload)
    });
  
    return true;
  }
