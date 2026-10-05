import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, CssBaseline, Snackbar, ThemeProvider, useMediaQuery } from '@mui/material';
import { buildTheme } from '../theme';
import { I18nProvider } from '../i18n/I18nProvider';
import { AuthProvider } from './AuthProvider';

const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });
const NotifyContext = createContext(() => {});

const STORAGE_KEY = 'code-diary-color-mode';

const readStoredMode = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

export const AppProviders = ({ children }) => {
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
    const [storedMode, setStoredMode] = useState(readStoredMode);
    const mode = storedMode || (prefersDark ? 'dark' : 'light');

    const toggle = useCallback(() => {
        const next = mode === 'dark' ? 'light' : 'dark';
        setStoredMode(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage kullanılamıyorsa tercih sadece bu oturumda geçerli olur
        }
    }, [mode]);

    const theme = useMemo(() => buildTheme(mode), [mode]);
    const colorMode = useMemo(() => ({ mode, toggle }), [mode, toggle]);

    const [toast, setToast] = useState(null);
    const notify = useCallback((message, severity = 'success') => {
        setToast({ message, severity, key: Date.now() });
    }, []);

    return (
        <I18nProvider>
            <AuthProvider>
                <ColorModeContext.Provider value={colorMode}>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <NotifyContext.Provider value={notify}>
                            {children}
                            <Snackbar
                                key={toast?.key}
                                open={Boolean(toast)}
                                autoHideDuration={4000}
                                onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                            >
                                {toast ? (
                                    <Alert
                                        onClose={() => setToast(null)}
                                        severity={toast.severity}
                                        variant="filled"
                                        sx={{ width: '100%' }}
                                    >
                                        {toast.message}
                                    </Alert>
                                ) : undefined}
                            </Snackbar>
                        </NotifyContext.Provider>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </AuthProvider>
        </I18nProvider>
    );
};

export const useColorMode = () => useContext(ColorModeContext);
export const useNotify = () => useContext(NotifyContext);
