import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { MONO_FONT } from '../theme';

/** Commit grafiği: iki commit düğümü ve sonraki adımı simgeleyen AI parıltısı (public/favicon.svg ile aynı çizim). */
export const LogoMark = ({ size = 34 }) => (
    <Box
        sx={{
            width: size,
            height: size,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0,
        }}
    >
        <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
            <path d="M14 32h21" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <circle cx="14" cy="32" r="5.5" fill="currentColor" />
            <circle cx="28" cy="32" r="5.5" fill="currentColor" />
            <path d="M46 21Q47.4 30.6 57 32Q47.4 33.4 46 43Q44.6 33.4 35 32Q44.6 30.6 46 21Z" fill="currentColor" />
        </svg>
    </Box>
);

const Logo = () => (
    <Box
        component={RouterLink}
        to="/"
        aria-label="commit.log"
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary', textDecoration: 'none' }}
    >
        <LogoMark />
        <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
            commit
            <Box component="span" sx={{ color: 'primary.main' }}>
                .
            </Box>
            log
        </Typography>
    </Box>
);

export default Logo;
