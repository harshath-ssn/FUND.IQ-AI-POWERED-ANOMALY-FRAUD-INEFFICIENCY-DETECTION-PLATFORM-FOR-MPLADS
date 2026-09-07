// Origin-aware navigation stack (A4.7). Shared so that opening a work from
// Map vs. Risk & Alerts vs. a filtered list each remembers where "Back"
// should return to. Session-only (not persisted to localStorage) -- origin
// context resets on refresh, which is the correct behaviour for a nav stack.
//
// No JSX (plain .js file, see workflowStore.js for why).

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [stack, setStack] = useState([]); // [{ origin, label }]

  const pushOrigin = useCallback((origin, label) => {
    setStack((prev) => [...prev, { origin, label: label || origin }]);
  }, []);

  const popOrigin = useCallback(() => {
    let popped = null;
    setStack((prev) => {
      if (prev.length === 0) return prev;
      popped = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    return popped;
  }, []);

  const resetOrigin = useCallback(() => setStack([]), []);

  const current = stack.length ? stack[stack.length - 1] : null;

  const value = useMemo(() => ({
    stack,
    current,
    pushOrigin,
    popOrigin,
    resetOrigin,
  }), [stack, current, pushOrigin, popOrigin, resetOrigin]);

  return React.createElement(NavigationContext.Provider, { value }, children);
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}
