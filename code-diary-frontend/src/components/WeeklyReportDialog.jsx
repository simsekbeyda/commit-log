import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Markdown from './Markdown';
import { getWeeklyReport } from '../services/aiService';
import { getErrorMessage } from '../services/apiClient';
import { useI18n } from '../i18n/I18nProvider';
import { MONO_FONT } from '../theme';
import { formatDate } from '../utils/format';

const WeeklyReportDialog = ({ open, onClose }) => {
    const { lang, t } = useI18n();
    const [state, setState] = useState({ status: 'idle' });

    const load = useCallback(async (refresh = false) => {
        setState({ status: 'loading' });
        try {
            const res = await getWeeklyReport(refresh);
            setState({ status: 'done', data: res.data });
        } catch (err) {
            setState({ status: 'error', error: getErrorMessage(err) });
        }
    }, []);

    useEffect(() => {
        if (open) void load();
    }, [open, lang, load]);

    const data = state.data;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <DialogTitle component="div" sx={{ pr: 7 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <AutoAwesomeRoundedIcon color="primary" fontSize="small" />
                    <Typography variant="h6" component="h2">
                        {t('weekly.title')}
                    </Typography>
                </Stack>
                {data && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO_FONT }}>
                        {t('weekly.range', {
                            from: formatDate(`${data.from}T00:00`, lang),
                            to: formatDate(`${data.to}T00:00`, lang),
                            n: data.entryCount,
                        })}
                    </Typography>
                )}
                {state.status === 'done' && data?.report && (
                    <Tooltip title={t('ai.regenerate')}>
                        <IconButton
                            onClick={() => load(true)}
                            aria-label={t('ai.regenerate')}
                            sx={{ position: 'absolute', right: 16, top: 16 }}
                        >
                            <RefreshRoundedIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </DialogTitle>
            <DialogContent dividers>
                {state.status === 'loading' || state.status === 'idle' ? (
                    <Stack spacing={1}>
                        <Typography variant="caption" color="primary" sx={{ fontFamily: MONO_FONT }}>
                            {t('ai.thinking')}
                        </Typography>
                        {[60, 100, 92, 40, 100, 85].map((w, i) => (
                            <Skeleton key={i} variant="text" width={`${w}%`} />
                        ))}
                    </Stack>
                ) : state.status === 'error' ? (
                    <Alert severity="error">{state.error}</Alert>
                ) : data.report ? (
                    <Markdown>{data.report}</Markdown>
                ) : (
                    <Typography color="text.secondary">{t('weekly.empty')}</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('weekly.close')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default WeeklyReportDialog;
