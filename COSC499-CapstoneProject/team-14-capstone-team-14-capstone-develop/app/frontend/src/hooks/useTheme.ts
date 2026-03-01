import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContextDefinition';
import type { ThemeContextType } from '../constants/theme';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
