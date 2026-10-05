import { createTheme, alpha } from '@mui/material/styles';

export const MONO_FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const palettes = {
    light: {
        mode: 'light',
        primary: { main: '#6d4aff', light: '#8f75ff', dark: '#5233d6', contrastText: '#ffffff' },
        secondary: { main: '#0ea5a4' },
        success: { main: '#16a34a' },
        error: { main: '#dc2626' },
        warning: { main: '#d97706' },
        background: { default: '#f6f7fb', paper: '#ffffff' },
        text: { primary: '#141824', secondary: '#5b6275' },
        divider: 'rgba(20, 24, 36, 0.09)',
    },
    dark: {
        mode: 'dark',
        primary: { main: '#9b85ff', light: '#b5a5ff', dark: '#7c5cff', contrastText: '#0f1117' },
        secondary: { main: '#2dd4bf' },
        success: { main: '#4ade80' },
        error: { main: '#f87171' },
        warning: { main: '#fbbf24' },
        background: { default: '#0f1117', paper: '#171a23' },
        text: { primary: '#e7e9f0', secondary: '#9aa1b5' },
        divider: 'rgba(231, 233, 240, 0.09)',
    },
};

export const buildTheme = (mode) => {
    const palette = palettes[mode];

    return createTheme({
        palette,
        shape: { borderRadius: 12 },
        typography: {
            fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-0.03em' },
            h2: { fontWeight: 800, letterSpacing: '-0.025em' },
            h3: { fontWeight: 700, letterSpacing: '-0.02em' },
            h4: { fontWeight: 700, letterSpacing: '-0.02em' },
            h5: { fontWeight: 700, letterSpacing: '-0.01em' },
            h6: { fontWeight: 600 },
            button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: { backgroundColor: palette.background.default },
                    '::selection': { background: alpha(palette.primary.main, 0.3) },
                },
            },
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } },
            },
            MuiPaper: {
                defaultProps: { elevation: 0 },
                styleOverrides: { root: { backgroundImage: 'none' } },
            },
            MuiCard: {
                styleOverrides: {
                    root: { border: `1px solid ${palette.divider}` },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: { root: { borderRadius: 10, backgroundColor: palette.background.paper } },
            },
            MuiChip: {
                styleOverrides: { root: { fontWeight: 500 } },
            },
            MuiTooltip: {
                defaultProps: { arrow: true },
            },
        },
    });
};
