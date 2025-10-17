import type { ThemeOptions } from '@mui/material/styles';

/**
 * Shared component overrides for both light and dark themes.
 */
const componentOverrides: ThemeOptions['components'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 'bold',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          direction: 'rtl',
        },
        // Force label to be RTL
        // '& label': {
        //   right: "28px",
        //   left: 'auto',
        //   transformOrigin: 'top right',
        // },
        '& .MuiOutlinedInput-input': {
          textAlign: 'right',
        },
        '& .MuiInputBase-input::placeholder': {
            textAlign: 'right',
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      // Force input text to be RTL
      input: {
        textAlign: 'right',
      }
    }
  },
};

/**
 * Light theme configuration.
 */
export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  components: componentOverrides,
};

/**
 * Modern dark blue theme configuration.
 */
export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#64b5f6', // A lighter blue for better contrast on dark background
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#0A1929', // Dark navy blue
      paper: '#1C293A',   // Slightly lighter navy blue for surfaces
    },
    text: {
      primary: '#EAECEE',
      secondary: '#B0B8C4',
    },
  },
  components: componentOverrides,
};
