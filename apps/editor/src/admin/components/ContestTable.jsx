import React from 'react';

export default function ContestTable({ contests, isLoading, onCreate }) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-500">Loading contests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">Contest Tracker</h2>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Contest
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Title</th>
              <th className="px-5 py-4 whitespace-nowrap">Start Time</th>
              <th className="px-5 py-4 whitespace-nowrap">End Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contests.length === 0 ? (
              <tr>
                <td colSpan="4" className="pe-5 py-16 text-center text-slate-500">
                  <p className="mb-2">No contests found.</p>
                  <p className="text-xs">Create your first competitive tournament!</p>
                </td>
              </tr>
            ) : (
              contests.map((contest) => (
                <tr key={contest.contest_id} className="transition-colors hover:bg-slate-50 cursor-default">
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      contest.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      contest.status === 'Upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {contest.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{contest.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{contest.description}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                    {new Date(contest.start_time).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                    {new Date(contest.end_time).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
