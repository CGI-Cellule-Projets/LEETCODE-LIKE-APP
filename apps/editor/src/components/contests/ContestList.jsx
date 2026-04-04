import React, { useState, useEffect } from 'react';

/**
 * ContestList Component
 * 
 * Expected API JSON Payload (from GET /api/contests):
 * {
 *   "success": true,
 *   "message": "Contests retrieved successfully",
 *   "data": {
 *     "upcoming": [ { contest_id: 1, title: 'Weekly Contest 1', start_time: '...', end_time: '...', description: '...' } ],
 *     "active": [],
 *     "past": []
 *   }
 * }
 */
export default function ContestList() {
  const [activeTab, setActiveTab] = useState('upcoming');

  // Currently purely a scaffold - fetching logic to be wired up here
  const mockupData = {
    upcoming: [
      { contest_id: 2, title: 'Weekly Contest 145', start_time: '2024-12-01T10:00:00Z', end_time: '2024-12-01T11:30:00Z', description: 'Join our weekly algorithm challenge!' }
    ],
    active: [],
    past: [
      { contest_id: 1, title: 'Biweekly Contest 42', start_time: '2024-01-01T08:00:00Z', end_time: '2024-01-01T09:30:00Z', description: 'Past biweekly competition.' }
    ]
  };

  const renderContestCards = (contests) => {
    if (!contests || contests.length === 0) {
      return <div className="p-8 text-center text-gray-500">No contests in this category.</div>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map(c => (
          <div key={c.contest_id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-2 text-gray-800">{c.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{c.description}</p>
            <div className="mt-auto">
              <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full font-medium">
                Starts: {new Date(c.start_time).toLocaleString()}
              </span>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Platform Contests</h1>
        <p className="text-gray-600">Compete with the community and improve your algorithmic skills.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 justify-center">
        {['upcoming', 'active', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} Contests
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-6 min-h-[400px]">
        {renderContestCards(mockupData[activeTab])}
      </div>
    </div>
  );
}
