'use client';

import { useState } from 'react';

export interface FilterState {
  branch: string;
  sort: 'sgpa' | 'backs';
  order: 'asc' | 'desc';
  search?: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-bg-primary/60 border border-border-subtle">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 whitespace-nowrap ${
            value === opt.value
              ? 'bg-accent-primary text-white shadow-[0_0_12px_rgba(91,156,246,0.4)]'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    branch: '',
    sort: 'sgpa',
    order: 'desc',
    search: '',
  });

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const branchOptions = [
    { value: '' as string, label: 'All' },
    { value: 'CSE', label: 'CSE' },
    { value: 'CSE_AIML', label: 'CSE AI/ML' },
    { value: 'CST', label: 'CST' },
  ];

  const sortOptions = [
    { value: 'sgpa' as const, label: '📈 CGPA' },
    { value: 'backs' as const, label: '🔺 Backs' },
  ];

  const orderOptions = [
    { value: 'desc' as const, label: '↑ High → Low' },
    { value: 'asc' as const, label: '↓ Low → High' },
  ];

  return (
    <section className="flex flex-col gap-4 mb-8 p-5 md:p-6 rounded-3xl bg-bg-secondary/40 border border-border-subtle backdrop-blur-md relative z-30">
      {/* Filter pill groups */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Branch */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Branch</span>
          <PillGroup
            options={branchOptions}
            value={filters.branch}
            onChange={(v) => updateFilter('branch', v)}
          />
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Sort By</span>
          <PillGroup
            options={sortOptions}
            value={filters.sort}
            onChange={(v) => updateFilter('sort', v)}
          />
        </div>

        {/* Order */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Order</span>
          <PillGroup
            options={orderOptions}
            value={filters.order}
            onChange={(v) => updateFilter('order', v)}
          />
        </div>
      </div>
    </section>
  );
}
