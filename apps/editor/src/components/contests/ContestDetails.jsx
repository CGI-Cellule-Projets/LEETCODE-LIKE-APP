import React from 'react';

/**
 * ContestDetails Component
 * 
 * Expected API JSON Payload (from GET /api/contests/:id):
 * {
 *   "success": true,
 *   "data": {
 *     "contest_id": 1, 
 *     "title": "Weekly Contest 145", 
 *     "start_time": "2024-12-01T10:00:00Z", 
 *     "end_time": "2024-12-01T11:30:00Z", 
 *     "description": "Join our weekly algorithm challenge!",
 *     "problems": [
 *        { "problem_id": 1, "name": "Two Sum", "difficulty_level": "easy", "points": 100 },
 *        { "problem_id": 2, "name": "LRU Cache", "difficulty_level": "hard", "points": 300 }
 *     ]
 *   }
 * }
 * 
 * Target Action Payload (to POST /api/contests/:id/register):
 * Requires JWT Bearer Token in headers. Returns 201 Created.
 */
export default function ContestDetails() {
  const mockupContest = {
    contest_id: 1,
    title: 'Weekly Contest 145',
    start_time: '2024-12-01T10:00:00Z',
    end_time: '2024-12-01T11:30:00Z',
    description: 'Join our weekly algorithm challenge to win platform badges and climb the global ranking leaderboard. This contest strictly features 4 problems scaling from Easy to Hard.',
    problems: [
      { problem_id: 1, name: 'Two Sum Variant', difficulty_level: 'easy', points: 100 },
      { problem_id: 2, name: 'Dynamic Traversal', difficulty_level: 'med', points: 200 },
      { problem_id: 3, name: 'Advanced Graph Theory', difficulty_level: 'hard', points: 400 }
    ]
  };

  const handleRegister = () => {
    // API Mapping: await fetch(`/api/contests/${mockupContest.contest_id}/register`, { method: 'POST', headers: { Authorization: 'Bearer ...' }});
    console.log(`Triggering Registration for Contest ${mockupContest.contest_id}`);
    alert('User registration requested (Console logged)');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {/* Header section */}
        <div className="bg-gray-800 text-white p-8">
          <h1 className="text-3xl font-bold mb-4">{mockupContest.title}</h1>
          <p className="text-gray-300 max-w-2xl text-lg leading-relaxed">{mockupContest.description}</p>
        </div>

        {/* Metrics/Stats strip */}
        <div className="bg-gray-50 border-b p-6 flex flex-wrap gap-8">
          <div>
            <h4 className="text-gray-500 text-sm font-semibold uppercase">Starts At</h4>
            <p className="text-xl text-gray-900 font-mono mt-1">{new Date(mockupContest.start_time).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-gray-500 text-sm font-semibold uppercase">Ends At</h4>
            <p className="text-xl text-gray-900 font-mono mt-1">{new Date(mockupContest.end_time).toLocaleString()}</p>
          </div>
        </div>

        {/* Main interactive area */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Contest Blueprint</h2>
            <button 
              onClick={handleRegister}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded shadow transition-colors"
            >
              Register Now
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 border-b">
                  <th className="py-3 px-4 font-semibold">Problem</th>
                  <th className="py-3 px-4 font-semibold">Difficulty</th>
                  <th className="py-3 px-4 font-semibold text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockupContest.problems.map((prob) => (
                  <tr key={prob.problem_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-blue-600">{prob.name}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        prob.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' : 
                        prob.difficulty_level === 'med' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {prob.difficulty_level}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-gray-600">{prob.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
