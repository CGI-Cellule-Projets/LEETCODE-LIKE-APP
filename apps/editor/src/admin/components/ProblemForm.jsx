import { Controller, useForm } from 'react-hook-form';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import TagInput from './TagInput';
import TestCaseList from './TestCaseList';

const markdownOptions = {
  spellChecker: false,
  status: false,
  placeholder: 'Write the problem statement using Markdown...'
};

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'med' },
  { label: 'Hard', value: 'hard' }
];

function normalizeDefaults(problem) {
  if (!problem) {
    return {
      problem_id: null,
      name: '',
      difficulty_level: 'easy',
      is_published: false,
      description: '',
      topics: [],
      testCases: []
    };
  }

  return {
    problem_id: problem.problem_id,
    name: problem.name || '',
    difficulty_level: problem.difficulty_level || 'easy',
    is_published: Boolean(problem.is_published),
    description: problem.description || '',
    topics: problem.topics || [],
    testCases: (problem.testCases || []).map((item) => ({
      input_data: item.input_data || '',
      expected_output: item.expected_output || '',
      is_hidden: Boolean(item.is_hidden),
      isExisting: true
    }))
  };
}

export default function ProblemForm({ problem, onSubmit, onCancel, isSaving }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: normalizeDefaults(problem),
    mode: 'onTouched'
  });

  const isEditMode = Boolean(problem?.problem_id);

  return (
    <section className="rounded-2xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isEditMode ? `Edit #${problem.problem_id}` : 'Create New Problem'}
          </h2>
          <p className="text-sm text-slate-600">
            Reuses existing API fields: name, difficulty_level, description, is_published, and test_cases payload.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back to List
        </button>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-3">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
            <input
              {...register('name', { required: 'Title is required' })}
              placeholder="e.g. Two Sum"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-300 transition focus:ring"
            />
            {errors.name && <span className="text-xs text-rose-600">{errors.name.message}</span>}
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</span>
            <select
              {...register('difficulty_level', { required: 'Difficulty is required' })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-300 transition focus:ring"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-3">
            <input
              type="checkbox"
              {...register('is_published')}
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
            />
            Published (unchecked means Draft)
          </label>
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-base font-semibold text-slate-900">Description (Markdown)</h3>
          <Controller
            control={control}
            name="description"
            rules={{ required: 'Description is required' }}
            render={({ field }) => (
              <SimpleMDE
                value={field.value}
                onChange={field.onChange}
                options={markdownOptions}
              />
            )}
          />
          {errors.description && <span className="text-xs text-rose-600">{errors.description.message}</span>}
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-base font-semibold text-slate-900">Tagging / Categorization</h3>
          <Controller
            control={control}
            name="topics"
            render={({ field }) => <TagInput value={field.value || []} onChange={field.onChange} />}
          />
          <p className="text-xs text-slate-500">Topics are kept in form data to align with optional API type support.</p>
        </section>

        <TestCaseList control={control} register={register} errors={errors} />

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Existing test-case update/delete endpoints are not available yet. In edit mode, newly added test cases are appended.
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update Problem' : 'Create Problem'}
          </button>
        </footer>
      </form>
    </section>
  );
}
