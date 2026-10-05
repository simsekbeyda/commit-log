import { Box, Button, Paper, Typography } from '@mui/material';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import { MONO_FONT } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

export const EmptyState = ({ icon, title, description, action }) => (
    <Paper
        variant="outlined"
        sx={{ py: 8, px: 3, textAlign: 'center', borderStyle: 'dashed', borderRadius: 1.5, bgcolor: 'transparent' }}
    >
        <Box sx={{ fontSize: 40, mb: 1.5, fontFamily: MONO_FONT, color: 'primary.main' }}>{icon}</Box>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: action ? 3 : 0, maxWidth: 420, mx: 'auto' }}>
            {description}
        </Typography>
        {action}
    </Paper>
);

export const ErrorState = ({ message, onRetry }) => {
    const { t } = useI18n();
    return (
        <EmptyState
            icon={<CloudOffRoundedIcon fontSize="inherit" color="error" />}
            title={t('error.title')}
            description={message}
            action={
                onRetry && (
                    <Button variant="outlined" onClick={onRetry}>
                        {t('common.retry')}
                    </Button>
                )
            }
        />
    );
};
