import { useState } from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useColorMode } from '../context/AppProviders';
import { useAuth } from '../context/AuthProvider';
import { MONO_FONT } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

const Layout = () => {
    const { mode, toggle } = useColorMode();
    const { pathname } = useLocation();
    const { lang, setLang, t } = useI18n();
    const { user, logout } = useAuth();
    const [menuAnchor, setMenuAnchor] = useState(null);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar
                position="sticky"
                color="transparent"
                elevation={0}
                sx={{
                    top: 0,
                    backdropFilter: 'blur(12px)',
                    backgroundColor: (t) => alpha(t.palette.background.default, 0.8),
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ gap: 1 }}>
                        <Logo />
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title={t('lang.switch')}>
                            <Button
                                color="inherit"
                                onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
                                aria-label={t('lang.switch')}
                                sx={{ minWidth: 0, px: 1.25, fontFamily: MONO_FONT, fontWeight: 600, fontSize: 13 }}
                            >
                                {lang === 'tr' ? 'EN' : 'TR'}
                            </Button>
                        </Tooltip>
                        <Tooltip title={mode === 'dark' ? t('theme.light') : t('theme.dark')}>
                            <IconButton onClick={toggle} aria-label={t('theme.toggle')}>
                                {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
                            </IconButton>
                        </Tooltip>
                        {user && pathname !== '/new' && (
                            <Button
                                component={RouterLink}
                                to="/new"
                                variant="contained"
                                startIcon={<AddRoundedIcon />}
                                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                            >
                                {t('nav.new')}
                            </Button>
                        )}
                        {user && (
                            <>
                                <Tooltip title={t('auth.account')}>
                                    <IconButton
                                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                                        aria-label={t('auth.account')}
                                    >
                                        <Avatar sx={{ width: 32, height: 32, fontSize: 15, bgcolor: 'primary.main' }}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    anchorEl={menuAnchor}
                                    open={Boolean(menuAnchor)}
                                    onClose={() => setMenuAnchor(null)}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                >
                                    <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography fontWeight={600} sx={{ fontFamily: MONO_FONT, fontSize: 14 }}>
                                            {user.username}
                                        </Typography>
                                        {user.guest && <Chip label={t('auth.guest')} size="small" />}
                                    </Box>
                                    <Divider />
                                    <MenuItem
                                        onClick={() => {
                                            setMenuAnchor(null);
                                            logout();
                                        }}
                                    >
                                        <ListItemIcon>
                                            <LogoutRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        {t('auth.logout')}
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 3 }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: MONO_FONT, fontSize: 12.5, textAlign: 'center' }}
                    >
                        {'// Spring Boot · Spring AI · React · Material UI'}
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;
