const difficultyBadge = {
  easy: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  med: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  hard: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
};

function formatDifficulty(value) {
  if (value === 'med') return 'Medium';
  if (!value) return 'Unknown';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatStatus(problem) {
  return problem.is_published ? 'Published' : 'Draft';
}

export default function ProblemTable({ problems, isLoading, onCreate, onEdit, onDelete }) {
  return (
    <section className="rounded-2xl border border-white/50 bg-white/70 shadow-xl backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Problem Catalog</h2>
          <p className="text-sm text-slate-500">Manage all coding challenges from one panel.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-0.5 hover:bg-brand-600"
        >
          Create New Problem
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100/80 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Difficulty</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white/40">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Loading problems...
                </td>
              </tr>
            )}

            {!isLoading && problems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No problems yet. Create your first one.
                </td>
              </tr>
            )}

            {!isLoading &&
              problems.map((problem) => (
                <tr key={problem.problem_id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">#{problem.problem_id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{problem.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${difficultyBadge[problem.difficulty_level] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}`}>
                      {formatDifficulty(problem.difficulty_level)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{formatStatus(problem)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(problem)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(problem)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
