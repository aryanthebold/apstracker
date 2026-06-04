'use client';

import { useState } from 'react';
import { GitBranch, ArrowUpDown, ShieldCheck, ChevronsUpDown } from 'lucide-react';

export interface FilterState {
  branch: string;
  sort: 'sgpa' | 'backs';
  order: 'asc' | 'desc';
  has_backs: boolean | null;
  search?: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    branch: '',
    sort: 'sgpa',
    order: 'desc',
    has_backs: null,
    search: '',
  });

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const branches = [
    { value: '', label: 'All Branches' },
    { value: 'CSE', label: 'CSE' },
    { value: 'CSE_AIML', label: 'CSE AI/ML' },
    { value: 'CST', label: 'CST' },
  ];

  return (
    <section className="flex flex-col gap-5 mb-8 p-6 md:p-7 rounded-3xl bg-bg-secondary/40 border border-border-subtle backdrop-blur-md relative z-30">
      {/* Filter Controls Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">

        {/* Branch Filter */}
        <div className="relative z-10 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Branch</label>
          <div className="relative">
            <GitBranch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-violet z-20" />
            <select
              value={filters.branch}
              onChange={(e) => updateFilter('branch', e.target.value)}
              className="appearance-none w-full rounded-xl bg-[#0d1017] border border-white/[0.07] hover:border-accent-violet/40 focus:border-accent-violet/60 focus:ring-2 focus:ring-accent-violet/15 pl-10 pr-10 py-3 text-[13px] font-semibold text-[#eef2ff] cursor-pointer transition-all duration-200 outline-none"
            >
              {branches.map((b) => (
                <option key={b.value} value={b.value} className="bg-[#0e1118] text-[#eef2ff]">
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary z-20" />
          </div>
        </div>

        {/* Sort Filter */}
        <div className="relative z-10 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Sort By</label>
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-primary z-20" />
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value as 'sgpa' | 'backs')}
              className="appearance-none w-full rounded-xl bg-[#0d1017] border border-white/[0.07] hover:border-accent-primary/40 focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/15 pl-10 pr-10 py-3 text-[13px] font-semibold text-accent-primary cursor-pointer transition-all duration-200 outline-none"
            >
              <option value="sgpa" className="bg-[#0e1118] text-[#eef2ff]">CGPA / SGPA</option>
              <option value="backs" className="bg-[#0e1118] text-[#eef2ff]">Backs Count</option>
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary z-20" />
          </div>
        </div>

        {/* Backs Filter */}
        <div className="relative z-10 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Records</label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-success z-20" />
            <select
              value={filters.has_backs === null ? '' : String(filters.has_backs)}
              onChange={(e) => {
                const val = e.target.value;
                updateFilter('has_backs', val === '' ? null : val === 'true');
              }}
              className="appearance-none w-full rounded-xl bg-[#0d1017] border border-white/[0.07] hover:border-accent-success/40 focus:border-accent-success/60 focus:ring-2 focus:ring-accent-success/15 pl-10 pr-10 py-3 text-[13px] font-semibold text-[#eef2ff] cursor-pointer transition-all duration-200 outline-none"
            >
              <option value="" className="bg-[#0e1118] text-[#eef2ff]">All Records</option>
              <option value="false" className="bg-[#0e1118] text-[#eef2ff]">No Backs (Clean)</option>
              <option value="true" className="bg-[#0e1118] text-[#eef2ff]">Has Backs</option>
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary z-20" />
          </div>
        </div>

        {/* Order Filter */}
        <div className="relative z-10 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] pl-1">Order</label>
          <div className="relative">
            <ChevronsUpDown className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-cyan z-20" />
            <select
              value={filters.order}
              onChange={(e) => updateFilter('order', e.target.value as 'asc' | 'desc')}
              className="appearance-none w-full rounded-xl bg-[#0d1017] border border-white/[0.07] hover:border-accent-cyan/40 focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/15 pl-10 pr-10 py-3 text-[13px] font-semibold text-[#eef2ff] cursor-pointer transition-all duration-200 outline-none"
            >
              <option value="desc" className="bg-[#0e1118] text-[#eef2ff]">High → Low</option>
              <option value="asc" className="bg-[#0e1118] text-[#eef2ff]">Low → High</option>
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary z-20" />
          </div>
        </div>
      </div>

    </section>
  );
}

