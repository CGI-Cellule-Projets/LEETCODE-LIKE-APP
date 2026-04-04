import { useState } from 'react';

export default function TagInput({ value, onChange }) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const existing = value || [];
    if (!existing.includes(trimmed)) {
      onChange([...existing, trimmed]);
    }
    setDraft('');
  };

  const removeTag = (tag) => {
    onChange(value.filter((item) => item !== tag));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(value || []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/30"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="Add a topic tag (e.g. Two Pointers)"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-300 transition focus:ring"
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Add
        </button>
      </div>
    </div>
  );
}
