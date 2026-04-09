import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { createContest } from '../services/contestAdminService.js';

export default function AdminContestForm() {
  const [feedback, setFeedback] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      problems: [{ problem_id: '', points: 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'problems',
  });

  const onSubmit = async (data) => {
    setFeedback(null);

    try {
      const contestPayload = {
        title: data.title.trim(),
        description: data.description.trim(),
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };
      const problemMappingsPayload = {
        problems: data.problems.map((problem) => ({
          problem_id: Number.parseInt(problem.problem_id, 10),
          points: Number.parseInt(problem.points, 10),
        })),
      };

      if (new Date(contestPayload.end_time).getTime() <= new Date(contestPayload.start_time).getTime()) {
        throw new Error('End time must be later than the start time.');
      }

      await createContest(contestPayload, problemMappingsPayload);
      setFeedback({ kind: 'success', message: 'Contest created and linked successfully.' });
      reset({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        problems: [{ problem_id: '', points: 100 }],
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Contest creation failed.',
      });
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Create New Contest</h2>
        <p className="text-gray-500">Configure global tournament schedules and bind algorithmic challenges.</p>
      </div>

      {feedback ? (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Base Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contest Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="e.g. Weekly Algorithm Challenge #42"
              />
              {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows="4"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="Define tournament rules, eligibility, and expected problem concepts."
              ></textarea>
              {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-blue-100 bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-blue-900">Scheduling Limits</h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Time (Local) *</label>
              <input
                type="datetime-local"
                {...register('start_time', { required: 'Start time is required' })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              {errors.start_time ? <p className="mt-1 text-xs text-red-500">{errors.start_time.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Time (Local) *</label>
              <input
                type="datetime-local"
                {...register('end_time', { required: 'End time is required' })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              {errors.end_time ? <p className="mt-1 text-xs text-red-500">{errors.end_time.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-gray-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Algorithmic Binding</h3>
            <button
              type="button"
              onClick={() => append({ problem_id: '', points: 100 })}
              className="min-h-11 rounded bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
            >
              + Add Problem Row
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-start gap-4 rounded border bg-white p-4 shadow-sm">
                <div className="flex-grow">
                  <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Database Problem ID</label>
                  <input
                    type="number"
                    {...register(`problems.${index}.problem_id`, { required: 'Problem ID is required', min: 1 })}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 font-mono"
                    placeholder="e.g. 5"
                  />
                  {errors?.problems?.[index]?.problem_id ? (
                    <p className="mt-1 text-xs text-red-500">{errors.problems[index].problem_id.message}</p>
                  ) : null}
                </div>

                <div className="w-32">
                  <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Points</label>
                  <input
                    type="number"
                    {...register(`problems.${index}.points`, { required: true, min: 1 })}
                    className="w-full rounded border border-gray-300 bg-blue-50 px-3 py-2 font-mono font-bold text-blue-600"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="min-h-11 min-w-11 rounded bg-red-100 p-2 text-red-600 disabled:opacity-50 hover:bg-red-200"
                    aria-label={`Remove problem row ${index + 1}`}
                    title="Remove Problem"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              reset();
            }}
            className="min-h-11 rounded border px-6 py-2 font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded bg-blue-600 px-8 py-2 font-bold text-white shadow transition-colors disabled:opacity-70 hover:bg-blue-700"
          >
            {isSubmitting ? 'Pushing Data...' : 'Launch Contest Integration'}
          </button>
        </div>
      </form>
    </div>
  );
}
