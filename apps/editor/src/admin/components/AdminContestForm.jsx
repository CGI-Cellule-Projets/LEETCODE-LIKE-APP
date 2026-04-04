import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

/**
 * AdminContestForm Component
 * 
 * Target API Payloads:
 * 1. Base Configuration: POST /api/admin/contests
 * {
 *   "title": "String",
 *   "description": "String",
 *   "start_time": "ISO String",
 *   "end_time": "ISO String"
 * }
 * 
 * 2. Problem Linking: POST /api/admin/contests/:id/problems
 * {
 *   "problems": [
 *     { "problem_id": Number, "points": Number }
 *   ]
 * }
 */
export default function AdminContestForm() {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      problems: [{ problem_id: '', points: 100 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'problems'
  });

  const onSubmit = async (data) => {
    try {
      // 1. Create Contest Header
      const contestPayload = {
        title: data.title,
        description: data.description,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };
      
      console.log('Sending Contest Creation Payload:', contestPayload);
      
      // Await fetch('/api/admin/contests', ...) retrieving the newly created ID
      const newContestId = 999; // Mocked simulation
      
      // 2. Hydrate Problems Mapping
      const mappingPayload = {
        problems: data.problems.map(p => ({
          problem_id: parseInt(p.problem_id),
          points: parseInt(p.points)
        }))
      };
      
      console.log(`Sending Problem Assignments to Contest ${newContestId}:`, mappingPayload);
      
      alert('Contest created successfully! Check console for payload outputs.');
      
    } catch (err) {
      console.error('Failed to orchestrate contest creation', err);
      alert('Creation failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 border border-gray-200">
      <div className="mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Create New Contest</h2>
        <p className="text-gray-500">Configure global tournament schedules and bind algorithmic challenges.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Section 1: Basic Details */}
        <section className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Base Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contest Title *</label>
              <input 
                {...register("title", { required: "Title is required" })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="e.g. Weekly Algorithm Challenge #42"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea 
                {...register("description", { required: "Description is required" })}
                rows="4"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="Define tournament rules, eligibility, and expected problem concepts."
              ></textarea>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Scheduling */}
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
           <h3 className="text-lg font-semibold text-blue-900 mb-4">Scheduling Limits</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (Local) *</label>
                <input 
                  type="datetime-local"
                  {...register("start_time", { required: "Start time is required" })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time (Local) *</label>
                <input 
                  type="datetime-local"
                  {...register("end_time", { required: "End time is required" })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>}
              </div>
           </div>
        </section>

        {/* Section 3: Problem Mapping */}
        <section className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Algorithmic Binding</h3>
            <button 
              type="button" 
              onClick={() => append({ problem_id: '', points: 100 })}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded transition-colors font-medium"
            >
              + Add Problem Row
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start bg-white p-4 border rounded shadow-sm">
                <div className="flex-grow">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Database Problem ID</label>
                  <input
                    type="number"
                    {...register(`problems.${index}.problem_id`, { required: "Problem ID is required" })}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 font-mono"
                    placeholder="e.g. 5"
                  />
                  {errors?.problems?.[index]?.problem_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.problems[index].problem_id.message}</p>
                  )}
                </div>

                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Points</label>
                  <input
                    type="number"
                    {...register(`problems.${index}.points`, { required: true, min: 1 })}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-blue-600 font-bold bg-blue-50"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="button" 
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded disabled:opacity-50"
                    title="Remove Problem"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-4 border-t border-gray-200 flex justify-end gap-4">
          <button type="button" className="px-6 py-2 border rounded font-medium text-gray-600 hover:bg-gray-100">
            Cancel 
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow transition-colors disabled:opacity-70 flex items-center"
          >
            {isSubmitting ? 'Pushing Data...' : 'Launch Contest Integration'}
          </button>
        </div>

      </form>
    </div>
  );
}
