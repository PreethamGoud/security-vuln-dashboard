import React, { createContext, useContext, useMemo, useState } from "react";

export type FiltersState = {
  // Analysis buttons (to be wired into filtering logic):
  excludeKaiInvalid: boolean; // filters out kaiStatus "invalid - norisk"
  excludeAiInvalid: boolean; // filters out kaiStatus "ai-invalid-norisk"
};

type FiltersContextValue = {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  reset: () => void;
  // Helper derived labels (for UI badges later)
  activeFilterCount: number;
};

const DEFAULT_FILTERS: FiltersState = {
  excludeKaiInvalid: false,
  excludeAiInvalid: false,
};

const FiltersContext = createContext<FiltersContextValue | undefined>(
  undefined
);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  const value = useMemo<FiltersContextValue>(() => {
    const activeFilterCount =
      (filters.excludeKaiInvalid ? 1 : 0) + (filters.excludeAiInvalid ? 1 : 0);

    return {
      filters,
      setFilters,
      reset: () => setFilters(DEFAULT_FILTERS),
      activeFilterCount,
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
