import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SelectionContextValue = {
  selected: string[]; // CVE ids
  toggle: (cve: string) => void;
  clear: () => void;
  canCompare: boolean; // true when exactly 2 are selected
};

const SelectionContext = createContext<SelectionContextValue | undefined>(
  undefined
);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((cve: string) => {
    setSelected((prev) => {
      if (prev.includes(cve)) return prev.filter((x) => x !== cve);
      // cap at 2; when adding a third, drop the oldest
      const next = [...prev, cve];
      return next.length > 2 ? next.slice(next.length - 2) : next;
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo<SelectionContextValue>(() => {
    return {
      selected,
      toggle,
      clear,
      canCompare: selected.length === 2,
    };
  }, [selected, toggle, clear]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx)
    throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
