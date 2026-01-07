import React, { createContext, useContext } from 'react';

// Simple theme context - just a placeholder for future dark mode
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // No state, no async operations - just pass through
  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};

// Simple hook - not used anymore
export const useTheme = () => {
  return {};
};

