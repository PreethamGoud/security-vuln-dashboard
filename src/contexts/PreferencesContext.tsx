import React, { createContext, useContext, useEffect, useState } from "react";

export type UserPreferences = {
  theme: "light" | "dark";
  savedFilters: Array<{
    name: string;
    filters: any; // FiltersState
  }>;
  chartPreferences: {
    showSeverity: boolean;
    showTrend: boolean;
    showRiskFactors: boolean;
  };
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  savedFilters: [],
  chartPreferences: {
    showSeverity: true,
    showTrend: true,
    showRiskFactors: true,
  },
};

type PreferencesContextValue = {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  saveFilterPreset: (name: string, filters: any) => void;
  deleteFilterPreset: (name: string) => void;
  loadFilterPreset: (name: string) => any | null;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "vuln-dashboard-preferences";

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  }, []);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const saveFilterPreset = (name: string, filters: any) => {
    setPreferences((prev) => ({
      ...prev,
      savedFilters: [
        ...prev.savedFilters.filter((f) => f.name !== name),
        { name, filters },
      ],
    }));
  };

  const deleteFilterPreset = (name: string) => {
    setPreferences((prev) => ({
      ...prev,
      savedFilters: prev.savedFilters.filter((f) => f.name !== name),
    }));
  };

  const loadFilterPreset = (name: string) => {
    const preset = preferences.savedFilters.find((f) => f.name === name);
    return preset?.filters ?? null;
  };

  const value: PreferencesContextValue = {
    preferences,
    updatePreferences,
    saveFilterPreset,
    deleteFilterPreset,
    loadFilterPreset,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
