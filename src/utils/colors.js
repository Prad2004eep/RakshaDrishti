// Modern, vibrant color scheme for RakshaDrishti
export const colors = {
  // Primary Colors - Modern Purple/Violet
  primary: '#7C3AED', // Vibrant Purple
  primaryDark: '#5B21B6', // Deep Purple
  primaryLight: '#A78BFA', // Light Purple

  // Secondary Colors - Teal/Cyan
  secondary: '#06B6D4', // Bright Cyan
  secondaryDark: '#0891B2', // Dark Cyan
  secondaryLight: '#67E8F9', // Light Cyan

  // Accent Colors - Pink/Rose
  accent: '#EC4899', // Hot Pink
  accentDark: '#DB2777', // Deep Pink
  accentLight: '#F9A8D4', // Light Pink

  // Status Colors
  success: '#10B981', // Emerald Green
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  info: '#3B82F6', // Blue

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Dark Mode
  darkBg: '#0F172A',
  darkCard: '#1E293B',
  darkText: '#F1F5F9',
  darkBorder: '#334155',

  // Light Mode
  lightBg: '#FFFFFF',
  lightCard: '#F8FAFC',
  lightText: '#0F172A',
  lightBorder: '#E2E8F0',

  // Semantic Colors
  safe: '#10B981', // Emerald - Safe
  danger: '#EF4444', // Red - Danger
  warning: '#F59E0B', // Amber - Warning
  neutral: '#6B7280', // Gray - Neutral

  // Gradient Colors (2-color gradient for headers)
  gradientStart: '#7C3AED', // Purple
  gradientEnd: '#06B6D4',   // Cyan
};

// Theme configurations
export const lightTheme = {
  background: colors.lightBg,
  card: colors.lightCard,
  text: colors.lightText,
  textSecondary: colors.gray600,
  border: colors.lightBorder,
  primary: colors.primary,
  secondary: colors.secondary,
};

export const darkTheme = {
  background: colors.darkBg,
  card: colors.darkCard,
  text: colors.darkText,
  textSecondary: colors.gray400,
  border: colors.darkBorder,
  primary: colors.primary,
  secondary: colors.secondary,
};

// Get theme based on mode
export const getTheme = (isDarkMode) => {
  return isDarkMode ? darkTheme : lightTheme;
};

