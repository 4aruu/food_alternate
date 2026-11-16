import React, { createContext, useContext, useMemo, useReducer } from 'react';

import { initialProfile, profileReducer } from '../utils/allergenProfile.js';

// In-memory only: the profile starts unconfigured on every page load and is
// never written to storage, the URL, history state or a cookie.
const AllergenProfileContext = createContext(null);

export function AllergenProfileProvider({ children }) {
  const [profile, dispatch] = useReducer(profileReducer, initialProfile);
  const value = useMemo(() => ({ profile, dispatch }), [profile]);
  return (
    <AllergenProfileContext.Provider value={value}>
      {children}
    </AllergenProfileContext.Provider>
  );
}

export function useAllergenProfile() {
  const value = useContext(AllergenProfileContext);
  if (value === null) {
    throw new Error('useAllergenProfile must be used inside AllergenProfileProvider');
  }
  return value;
}
