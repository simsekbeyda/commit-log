import { useState } from 'react';
import { Alert, Box, Button, Divider, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { getErrorMessage } from '../services/apiClient';
import { MONO_FONT } from '../theme';

const LoginPage = () => {
    const { t } = useI18n();
    const { isAuthenticated, login, register, startDemo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');

    const redirectTo = location.state?.from?.pathname || '/';
    if (isAuthenticated && !busy) {
        return <Navigate to={redirectTo} replace />;
    }

    const run = async (kind, action) => {
        setBusy(kind);
        setError('');
        try {
            await action();
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
            setBusy(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        void run(mode, () =>
            mode === 'login' ? login(username.trim(), password) : register(username.trim(), password),
        );
    };

    return (
        <Box sx={{ maxWidth: 420, mx: 'auto', pt: { xs: 1, md: 4 } }}>
            <Stack alignItems="center" spacing={1.5} sx={{ mb: 3, textAlign: 'center' }}>
                <LogoMark size={52} />
                <Typography variant="caption" color="primary" sx={{ fontFamily: MONO_FONT }}>
                    {t('auth.tagline')}
                </Typography>
                <Typography variant="h5" component="h1">
                    {t('auth.title')}
                </Typography>
                <Typography color="text.secondary">{t('auth.subtitle')}</Typography>
            </Stack>

            <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 1.5 }}>
                <Tabs
                    value={mode}
                    onChange={(_, value) => {
                        setMode(value);
                        setError('');
                    }}
                    variant="fullWidth"
                    sx={{ mb: 3 }}
                >
                    <Tab value="login" label={t('auth.tab.login')} />
                    <Tab value="register" label={t('auth.tab.register')} />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
                    <TextField
                        label={t('auth.username')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                        fullWidth
                    />
                    <TextField
                        label={t('auth.password')}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        helperText={mode === 'register' ? t('auth.passwordHint') : ' '}
                        required
                        fullWidth
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={Boolean(busy) || !username.trim() || !password}
                    >
                        {t(mode === 'login' ? 'auth.submit.login' : 'auth.submit.register')}
                    </Button>
                </Stack>

                <Divider sx={{ my: 3, color: 'text.secondary', fontSize: 13 }}>{t('auth.or')}</Divider>

                <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrowRoundedIcon />}
                    disabled={Boolean(busy)}
                    onClick={() => run('demo', startDemo)}
                >
                    {t('auth.demo')}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, textAlign: 'center' }}>
                    {t('auth.demoHint')}
                </Typography>
            </Paper>
        </Box>
    );
};

export default LoginPage;
