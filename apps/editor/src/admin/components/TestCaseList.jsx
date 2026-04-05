import { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';

const emptyTestCase = {
  input_data: '',
  expected_output: '',
  is_hidden: false,
  isExisting: false
};

export default function TestCaseList({ control, register, errors }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'testCases'
  });

  useEffect(() => {
    if (fields.length === 0) {
      append({ ...emptyTestCase });
    }
  }, [append, fields.length]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">Dynamic Test Case Manager</h3>
        <button
          type="button"
          onClick={() => append({ ...emptyTestCase })}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
        >
          Add Test Case
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Add at least one public sample test. Hidden tests are useful for final grading only.
      </p>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <article key={field.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Test Case {index + 1}</p>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Remove Test Case
              </button>
            </header>

            <input type="hidden" {...register(`testCases.${index}.isExisting`)} />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standard Input</span>
                <textarea
                  rows={4}
                  {...register(`testCases.${index}.input_data`, { required: 'Input is required' })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none ring-brand-300 transition focus:ring"
                />
                {errors.testCases?.[index]?.input_data && (
                  <span className="text-xs text-rose-600">{errors.testCases[index].input_data.message}</span>
                )}
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Output</span>
                <textarea
                  rows={4}
                  {...register(`testCases.${index}.expected_output`, { required: 'Expected output is required' })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none ring-brand-300 transition focus:ring"
                />
                {errors.testCases?.[index]?.expected_output && (
                  <span className="text-xs text-rose-600">{errors.testCases[index].expected_output.message}</span>
                )}
              </label>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                {...register(`testCases.${index}.is_hidden`)}
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
              />
              Is Hidden (final grading only)
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
