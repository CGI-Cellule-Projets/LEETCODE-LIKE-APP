import { useEffect, useMemo, useState } from 'react';
import ProblemTable from './components/ProblemTable';
import ProblemForm from './components/ProblemForm';
import ContestTable from './components/ContestTable';
import AdminContestForm from './components/AdminContestForm';
import {
  deleteProblem,
  getProblemDetails,
  getProblems,
  upsertProblemWithTestCases
} from './services/problemService';
import { getContestsAdmin } from './services/contestAdminService';

export default function AdminContentApp() {
  const [section, setSection] = useState('problems'); // 'problems' | 'contests'
  const [view, setView] = useState('table'); // 'table' | 'form'

  // Problems State
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  
  // Contests State
  const [contests, setContests] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  const pageTitle = useMemo(() => {
    if (section === 'contests') {
      return view === 'table' ? 'Contest Management' : 'Create Custom Tournament';
    }
    return view === 'table' ? 'Problem Content Management' : activeProblem ? 'Edit Algorithmic Problem' : 'Create Algorithmic Problem';
  }, [section, view, activeProblem]);

  async function refreshData() {
    setIsLoading(true);
    try {
      if (section === 'problems') {
        const rows = await getProblems();
        setProblems(rows);
      } else {
        const rows = await getContestsAdmin();
        setContests(rows);
      }
    } catch (error) {
      setBanner({ kind: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
    // Clear banner whenever we explicitly switch sections
    setBanner(null);
  }, [section]);

  const openCreate = () => {
    setActiveProblem(null);
    setView('form');
  };

  const openEditProblem = async (problem) => {
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
      setActiveProblem({ ...problem, testCases: [] });
      setView('form');
    }
  };

  const handleDeleteProblem = async (problem) => {
    const confirmed = window.confirm(`Delete ${problem.name}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteProblem(problem.problem_id);
      setBanner({ kind: 'success', message: 'Problem deleted successfully.' });
      await refreshData();
    } catch (error) {
      setBanner({ kind: 'error', message: error.message });
    }
  };

  const handleSubmitProblem = async (formValues) => {
    setIsSaving(true);
    setBanner(null);
    try {
      const mode = formValues.problem_id ? 'update' : 'create';
      await upsertProblemWithTestCases(mode, formValues);
      setBanner({ kind: 'success', message: mode === 'create' ? 'Problem created.' : 'Problem updated.' });
      setView('table');
      setActiveProblem(null);
      await refreshData();
    } catch (error) {
      setBanner({ kind: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_-10%,#fff8eb,transparent_42%),radial-gradient(circle_at_90%_20%,#ebf8ff,transparent_45%),#f8f7f3] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Universal Top Bar */}
        <div className="flex border-b border-slate-200 mb-6 justify-center">
          <button
            onClick={() => { setSection('problems'); setView('table'); }}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              section === 'problems'
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Algorithms Engine
          </button>
          <button
            onClick={() => { setSection('contests'); setView('table'); }}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              section === 'contests'
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Contests Tracking
          </button>
        </div>

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Global Admin Dashboard</p>
            <h1 className="text-3xl font-extrabold text-slate-900">{pageTitle}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage database records, schedule constraints, and modify live JSON deployments.
            </p>
          </div>
        </header>

        {banner && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
              banner.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
            {banner.message}
          </div>
        )}

        {/* Dynamic Routing Renderer */}
        {section === 'problems' && (
           view === 'table' ? (
            <ProblemTable
              problems={problems}
              isLoading={isLoading}
              onCreate={openCreate}
              onEdit={openEditProblem}
              onDelete={handleDeleteProblem}
            />
          ) : (
            <ProblemForm
              problem={activeProblem}
              onSubmit={handleSubmitProblem}
              onCancel={() => { setView('table'); setActiveProblem(null); }}
              isSaving={isSaving}
            />
          )
        )}

        {section === 'contests' && (
           view === 'table' ? (
            <ContestTable
              contests={contests}
              isLoading={isLoading}
              onCreate={openCreate}
            />
          ) : (
            // Instead of pure ProblemForm we render the robust standalone AdminContestForm 
            // In a real prod environment we could wrap it with identical onCancel callbacks but we are letting it act independently here
            <div>
              <div className="mb-4">
                 <button onClick={() => setView('table')} className="text-sm font-semibold text-indigo-600 hover:underline">
                   ← Back to Tracking Lists
                 </button>
              </div>
              <AdminContestForm />
            </div>
          )
        )}

      </div>
    </main>
  );
}
