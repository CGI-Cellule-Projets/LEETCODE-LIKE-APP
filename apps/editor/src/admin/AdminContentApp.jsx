import { useEffect, useMemo, useState } from 'react';
import ProblemTable from './components/ProblemTable';
import ProblemForm from './components/ProblemForm';
import {
  deleteProblem,
  getProblemDetails,
  getProblems,
  upsertProblemWithTestCases
} from './services/problemService';

export default function AdminContentApp() {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeProblem, setActiveProblem] = useState(null);
  const [view, setView] = useState('table');
  const [banner, setBanner] = useState(null);

  const pageTitle = useMemo(
    () => (view === 'table' ? 'Content Management' : activeProblem ? 'Edit Problem' : 'Create Problem'),
    [view, activeProblem]
  );

  async function refreshProblems() {
    setIsLoading(true);
    try {
      const rows = await getProblems();
      setProblems(rows);
    } catch (error) {
      setBanner({ kind: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshProblems();
  }, []);

  const openCreate = () => {
    setActiveProblem(null);
    setView('form');
  };

  const openEdit = async (problem) => {
    try {
      setBanner(null);
      const details = await getProblemDetails(problem.problem_id);

      setActiveProblem({
        ...problem,
        description: details?.description || problem.description || '',
        testCases: details?.public_test_cases || []
      });
      setView('form');
    } catch {
      // Fallback to list payload if details endpoint is unavailable.
      setActiveProblem({ ...problem, testCases: [] });
      setView('form');
    }
  };

  const handleDelete = async (problem) => {
    const confirmed = window.confirm(`Delete ${problem.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteProblem(problem.problem_id);
      setBanner({ kind: 'success', message: 'Problem deleted successfully.' });
      await refreshProblems();
    } catch (error) {
      setBanner({ kind: 'error', message: error.message });
    }
  };

  const handleSubmit = async (formValues) => {
    setIsSaving(true);
    setBanner(null);

    try {
      const mode = formValues.problem_id ? 'update' : 'create';
      await upsertProblemWithTestCases(mode, formValues);
      setBanner({ kind: 'success', message: mode === 'create' ? 'Problem created.' : 'Problem updated.' });
      setView('table');
      setActiveProblem(null);
      await refreshProblems();
    } catch (error) {
      setBanner({ kind: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_-10%,#fff8eb,transparent_42%),radial-gradient(circle_at_90%_20%,#ebf8ff,transparent_45%),#f8f7f3] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">AlgoForge Admin</p>
            <h1 className="text-3xl font-extrabold text-slate-900">{pageTitle}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Built with React hooks, react-hook-form, Tailwind, and the existing Admin REST API.
            </p>
          </div>
        </header>

        {banner && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              banner.kind === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {banner.message}
          </div>
        )}

        {view === 'table' ? (
          <ProblemTable
            problems={problems}
            isLoading={isLoading}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ProblemForm
            problem={activeProblem}
            onSubmit={handleSubmit}
            onCancel={() => {
              setView('table');
              setActiveProblem(null);
            }}
            isSaving={isSaving}
          />
        )}
      </div>
    </main>
  );
}
