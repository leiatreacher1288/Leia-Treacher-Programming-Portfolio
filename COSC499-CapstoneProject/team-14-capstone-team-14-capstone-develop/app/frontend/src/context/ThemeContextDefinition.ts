import { createContext } from 'react';
import type { ThemeContextType } from '../constants/theme';

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);
