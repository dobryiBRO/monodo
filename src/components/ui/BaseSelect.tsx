'use client';

import { useEffect, useRef, useState } from 'react';

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

interface BaseSelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function BaseSelect<T extends string | number>({ value, options, onChange }: BaseSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 pr-10 border-2 border-gray-300 rounded-2xl bg-white text-gray-900 font-medium shadow-sm hover:bg-blue-50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-sm">{selected?.label}</span>
        <svg className="w-4 h-4 text-gray-400 absolute right-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 rounded-2xl text-sm font-medium ${o.value === value ? 'text-blue-700' : 'text-gray-900'}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={o.value === value}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BaseSelect;


