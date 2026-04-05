import { useEffect, useMemo } from 'react';

const MEDAL_STYLES = {
  1: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200',
  2: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200',
  3: 'bg-orange-100 text-orange-900 ring-1 ring-orange-200',
};

const MEDAL_LABELS = {
  1: 'Or',
  2: 'Argent',
  3: 'Bronze',
};

function normalizeTimeValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.max(0, value % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return value || '--';
}

export default function CompetitionLeaderboard({
  entries = [],
  currentUsername = '',
  onRefresh,
  pollIntervalMs = 45000,
  isPollingEnabled = true,
  title = 'Leaderboard',
  subtitle = 'Classement mis à jour automatiquement',
  className = '',
}) {
  const sortedEntries = useMemo(() => {
    return [...entries]
      .map((entry, index) => ({
        ...entry,
        rank: Number(entry.rank) || index + 1,
      }))
      .sort((a, b) => a.rank - b.rank || Number(b.score_total || 0) - Number(a.score_total || 0));
  }, [entries]);

  useEffect(() => {
    if (!isPollingEnabled || typeof onRefresh !== 'function') {
      return undefined;
    }

    let cancelled = false;

    const refresh = async () => {
      if (cancelled) {
        return;
      }

      try {
        await onRefresh();
      } catch {
        // Keep polling alive even if a refresh fails.
      }
    };

    refresh();
    const intervalId = window.setInterval(refresh, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isPollingEnabled, onRefresh, pollIntervalMs]);

  if (sortedEntries.length === 0) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm ${className}`.trim()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <p className="py-8 text-center text-sm text-slate-500">Aucune donnée de classement pour le moment.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          Live
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50/90 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Rank</th>
              <th className="px-5 py-3 font-semibold">Utilisateur</th>
              <th className="px-5 py-3 font-semibold text-right">Score total</th>
              <th className="px-5 py-3 font-semibold text-right">Temps de résolution</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedEntries.map((entry) => {
              const isCurrentUser = currentUsername
                && entry.username
                && entry.username.toLowerCase() === currentUsername.toLowerCase();
              const medalStyle = MEDAL_STYLES[entry.rank] || 'bg-slate-50 text-slate-700';

              return (
                <tr
                  key={`${entry.username}-${entry.rank}`}
                  className={`${isCurrentUser ? 'bg-brand-50/70 ring-1 ring-inset ring-brand-200' : 'hover:bg-slate-50/70'} transition-colors`}
                >
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex min-w-10 items-center justify-center rounded-full px-2 py-1 text-xs font-bold ${medalStyle}`}>
                        #{entry.rank}
                      </span>
                      {MEDAL_LABELS[entry.rank] ? (
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${medalStyle}`}>
                          {MEDAL_LABELS[entry.rank]}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {String(entry.username || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{entry.username}</p>
                        {isCurrentUser ? (
                          <p className="text-xs font-medium text-brand-700">Votre compte</p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle text-right font-mono text-sm font-semibold tabular-nums text-slate-900">
                    {entry.score_total}
                  </td>

                  <td className="px-5 py-4 align-middle text-right font-mono text-sm tabular-nums text-slate-600">
                    {normalizeTimeValue(entry.temps_de_resolution)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}