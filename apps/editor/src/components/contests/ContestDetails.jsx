import React, { useEffect, useMemo, useState } from 'react';
import CompetitionLeaderboard from './CompetitionLeaderboard';
import CompetitionTimer from './CompetitionTimer';

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
  const mockupContest = useMemo(() => {
    const now = Date.now();

    return {
      contest_id: 145,
      title: 'Weekly Contest 145',
      start_time: new Date(now - 45 * 60 * 1000).toISOString(),
      end_time: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      description: 'Join our weekly algorithm challenge to win platform badges and climb the global ranking leaderboard. This contest strictly features 4 problems scaling from Easy to Hard.',
      problems: [
        { problem_id: 1, name: 'Two Sum Variant', difficulty_level: 'easy', points: 100 },
        { problem_id: 2, name: 'Dynamic Traversal', difficulty_level: 'med', points: 200 },
        { problem_id: 3, name: 'Advanced Graph Theory', difficulty_level: 'hard', points: 400 }
      ]
    };
  }, []);

  const [leaderboardEntries, setLeaderboardEntries] = useState([
    { username: 'nina', rank: 1, score_total: 860, temps_de_resolution: '18:42' },
    { username: 'omar', rank: 2, score_total: 820, temps_de_resolution: '19:14' },
    { username: 'yasmine', rank: 3, score_total: 790, temps_de_resolution: '20:03' },
    { username: 'karim', rank: 4, score_total: 710, temps_de_resolution: '22:11' },
    { username: 'sara', rank: 5, score_total: 680, temps_de_resolution: '23:09' },
  ]);
  const [contestFinished, setContestFinished] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());

  useEffect(() => {
    const tick = window.setInterval(() => {
      setLastSyncedAt(new Date());
    }, 45000);

    return () => window.clearInterval(tick);
  }, []);

  const handleLeaderboardRefresh = async () => {
    setLastSyncedAt(new Date());
    setLeaderboardEntries((currentEntries) => [...currentEntries]);
  };

  const handleRegister = () => {
    // API Mapping: await fetch(`/api/contests/${mockupContest.contest_id}/register`, { method: 'POST', headers: { Authorization: 'Bearer ...' }});
    console.log(`Triggering Registration for Contest ${mockupContest.contest_id}`);
    alert('User registration requested (Console logged)');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b border-slate-200 bg-gradient-to-r from-brand-50 via-white to-white p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Concours en direct</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 lg:text-4xl">{mockupContest.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{mockupContest.description}</p>
            </div>

            <button
              onClick={handleRegister}
              disabled={contestFinished}
              className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {contestFinished ? 'Concours terminé' : 'S’inscrire au concours'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50/80 p-6 md:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Début</h4>
            <p className="mt-1 font-mono text-lg text-slate-900 tabular-nums">{new Date(mockupContest.start_time).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fin</h4>
            <p className="mt-1 font-mono text-lg text-slate-900 tabular-nums">{new Date(mockupContest.end_time).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-6 p-6 lg:p-8">
          <CompetitionTimer
            endTime={mockupContest.end_time}
            onFinish={() => setContestFinished(true)}
          />

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Contest Blueprint</h2>
                  <p className="text-sm text-slate-500">Problèmes et points attribués pour ce concours.</p>
                </div>
                <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  {mockupContest.problems.length} problèmes
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Problème</th>
                      <th className="px-5 py-3 font-semibold">Difficulté</th>
                      <th className="px-5 py-3 font-semibold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {mockupContest.problems.map((prob) => (
                      <tr key={prob.problem_id} className="transition-colors hover:bg-brand-50/50">
                        <td className="px-5 py-4 font-medium text-brand-700">{prob.name}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            prob.difficulty_level === 'easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prob.difficulty_level === 'med'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            {prob.difficulty_level}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-sm text-slate-600 tabular-nums">{prob.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <CompetitionLeaderboard
              entries={leaderboardEntries}
              currentUsername="yasmine"
              onRefresh={handleLeaderboardRefresh}
              pollIntervalMs={30000}
              title="Leaderboard en temps réel"
              subtitle={`Dernière synchronisation : ${lastSyncedAt.toLocaleTimeString()}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
