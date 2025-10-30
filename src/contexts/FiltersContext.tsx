import React, { createContext, useContext, useMemo, useState } from "react";

export type FiltersState = {
  // Existing toggles
  excludeKaiInvalid: boolean; // filters out kaiStatus "invalid - norisk"
  excludeAiInvalid: boolean; // filters out kaiStatus "ai-invalid-norisk"

  // New advanced filters
  severities: string[]; // ["critical","high","medium","low","unknown"], empty = all
  packageQuery: string; // substring against packageName (case-insensitive)
  textQuery: string; // substring against cve, description, packageName (case-insensitive)
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string; // "YYYY-MM-DD"
};

type FiltersContextValue = {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  reset: () => void;
  activeFilterCount: number;
  // A stable string key for query caches and effects
  key: string;
};

const DEFAULT_FILTERS: FiltersState = {
  excludeKaiInvalid: false,
  excludeAiInvalid: false,
  severities: [],
  packageQuery: "",
  textQuery: "",
  dateFrom: undefined,
  dateTo: undefined,
};

const FiltersContext = createContext<FiltersContextValue | undefined>(
  undefined
);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  const value = useMemo<FiltersContextValue>(() => {
    let count = 0;
    if (filters.excludeKaiInvalid) count++;
    if (filters.excludeAiInvalid) count++;
    if (filters.severities.length) count++;
    if (filters.packageQuery.trim()) count++;
    if (filters.textQuery.trim()) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;

    // Keep a stable cache/effect key for hooks and react-query
    const key = JSON.stringify(filters);

    return {
      filters,
      setFilters,
      reset: () => setFilters(DEFAULT_FILTERS),
      activeFilterCount: count,
      key,
    };
  }, [filters]);

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
};

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
