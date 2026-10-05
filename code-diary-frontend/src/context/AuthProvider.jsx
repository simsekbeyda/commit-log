import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken, setUnauthorizedHandler } from '../services/apiClient';
import * as authApi from '../services/authService';

const STORAGE_KEY = 'commitlog-auth';

const readStoredSession = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return stored?.token ? stored : null;
    } catch {
        return null;
    }
};

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    login: async () => {},
    register: async () => {},
    startDemo: async () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(readStoredSession);

    // apiClient senkron güncellensin ki ilk istekler de token'la gitsin
    setAuthToken(session?.token ?? null);

    const saveSession = useCallback((next) => {
        setSession(next);
        try {
            if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
            // localStorage kullanılamıyorsa oturum sadece bu sekmede geçerli olur
        }
    }, []);

    const logout = useCallback(() => saveSession(null), [saveSession]);

    useEffect(() => {
        setUnauthorizedHandler(logout);
    }, [logout]);

    const handleResponse = useCallback(
        (res) => {
            saveSession({ token: res.data.token, user: res.data.user });
            return res.data.user;
        },
        [saveSession],
    );

    const value = useMemo(
        () => ({
            user: session?.user ?? null,
            isAuthenticated: Boolean(session?.token),
            login: (username, password) => authApi.login(username, password).then(handleResponse),
            register: (username, password) => authApi.register(username, password).then(handleResponse),
            startDemo: () => authApi.startDemo().then(handleResponse),
            logout,
        }),
        [session, handleResponse, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
