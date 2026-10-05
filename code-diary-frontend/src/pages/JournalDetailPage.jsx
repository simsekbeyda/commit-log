import { useEffect, useState } from 'react';
import { Box, Button, Divider, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AiPanel from '../components/AiPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../components/StatusState';
import { deleteJournal, getJournalById, updateJournal } from '../services/journalService';
import TagChips from '../components/TagChips';
import { getAiStatus } from '../services/aiService';
import { getErrorMessage } from '../services/apiClient';
import { useNotify } from '../context/AppProviders';
import { MONO_FONT } from '../theme';
import { countWords, formatDateTime, readingMinutes } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';

const JournalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const notify = useNotify();
    const { lang, t } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();

    const [journal, setJournal] = useState(null);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [aiMode, setAiMode] = useState('off');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let ignore = false;
        setStatus('loading');
        getJournalById(id)
            .then((res) => {
                if (ignore) return;
                setJournal(res.data);
                setStatus('ready');
            })
            .catch((err) => {
                if (ignore) return;
                setStatus(err.response?.status === 404 ? 'notFound' : 'error');
                setError(getErrorMessage(err));
            });
        return () => {
            ignore = true;
        };
    }, [id, reloadKey]);

    useEffect(() => {
        getAiStatus()
            .then((res) => setAiMode(res.data.mode ?? (res.data.configured ? 'openai' : 'off')))
            .catch(() => setAiMode('off'));
    }, []);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteJournal(id);
            notify(t('toast.deleted'));
            navigate('/');
        } catch (err) {
            notify(getErrorMessage(err), 'error');
            setDeleting(false);
        }
    };

    const addTags = async (keywords) => {
        try {
            const tags = [...new Set([...(journal.tags ?? []), ...keywords.map((k) => k.replace(/\s+/g, '-'))])].slice(
                0,
                10,
            );
            const res = await updateJournal(journal.id, { title: journal.title, content: journal.content, tags });
            setJournal(res.data);
            notify(t('ai.keywords.added'));
        } catch (err) {
            notify(getErrorMessage(err), 'error');
        }
    };

    const goToTag = (tag) => navigate(`/?tag=${encodeURIComponent(tag)}`);

    const backButton = (
        <Button component={RouterLink} to="/" startIcon={<ArrowBackRoundedIcon />} color="inherit" sx={{ mb: 3 }}>
            {t('detail.back')}
        </Button>
    );

    if (status === 'notFound') {
        return (
            <>
                {backButton}
                <EmptyState
                    icon={<TravelExploreRoundedIcon fontSize="inherit" />}
                    title={t('detail.notFound.title')}
                    description={t('detail.notFound.desc')}
                    action={
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                            <Button component={RouterLink} to="/" variant="outlined">
                                {t('detail.notFound.browse')}
                            </Button>
                            <Button component={RouterLink} to="/new" variant="contained" startIcon={<AddRoundedIcon />}>
                                {t('nav.new')}
                            </Button>
                        </Stack>
                    }
                />
            </>
        );
    }

    if (status === 'error') {
        return (
            <>
                {backButton}
                <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
            </>
        );
    }

    return (
        <Box>
            {backButton}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 1.5 }}>
                        {status === 'loading' ? (
                            <>
                                <Skeleton width="40%" />
                                <Skeleton variant="text" height={56} width="80%" />
                                <Skeleton variant="rounded" height={200} sx={{ mt: 2 }} />
                            </>
                        ) : (
                            <>
                                <Typography
                                    variant="caption"
                                    color="primary"
                                    sx={{ fontFamily: MONO_FONT, fontWeight: 500 }}
                                >
                                    {'// '}
                                    {formatDateTime(journal.createdAt, lang)}
                                </Typography>
                                <Typography variant="h4" component="h1" sx={{ mt: 1, mb: 2, wordBreak: 'break-word' }}>
                                    {journal.title}
                                </Typography>
                                <TagChips tags={journal.tags} onClick={goToTag} sx={{ mb: 2 }} />
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{ color: 'text.secondary', fontFamily: MONO_FONT, fontSize: 12.5, mb: 3 }}
                                >
                                    <span>{t('detail.words', { n: countWords(journal.content) })}</span>
                                    <span>{t('card.readTime', { n: readingMinutes(journal.content) })}</span>
                                    {journal.updatedAt !== journal.createdAt && (
                                        <span>
                                            {t('detail.edited', { date: formatDateTime(journal.updatedAt, lang) })}
                                        </span>
                                    )}
                                </Stack>
                                <Divider sx={{ mb: 3 }} />
                                <Typography
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.8,
                                        fontSize: 16.5,
                                    }}
                                >
                                    {journal.content}
                                </Typography>
                                <Divider sx={{ my: 3 }} />
                                <Stack direction="row" spacing={1.5}>
                                    <Button
                                        component={RouterLink}
                                        to={`/edit/${journal.id}`}
                                        variant="outlined"
                                        startIcon={<EditOutlinedIcon />}
                                    >
                                        {t('common.edit')}
                                    </Button>
                                    <Button
                                        color="error"
                                        startIcon={<DeleteOutlineRoundedIcon />}
                                        onClick={() => setConfirmOpen(true)}
                                    >
                                        {t('common.delete')}
                                    </Button>
                                </Stack>
                            </>
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
                        {status === 'ready' ? (
                            <AiPanel
                                // Dil değişince AI sonuçları yeni dilde yeniden üretilsin
                                key={`${journal.id}-${lang}`}
                                journalId={journal.id}
                                aiConfigured={aiMode !== 'off'}
                                demoMode={aiMode === 'demo'}
                                existingTags={journal.tags}
                                onAddTags={addTags}
                                activeTab={searchParams.get('tab') || 'summary'}
                                onTabChange={(tab) => setSearchParams({ tab }, { replace: true })}
                            />
                        ) : (
                            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 1.5 }} />
                        )}
                    </Box>
                </Grid>
            </Grid>

            <ConfirmDialog
                open={confirmOpen}
                title={t('delete.title')}
                message={t('delete.generic')}
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setConfirmOpen(false)}
            />
        </Box>
    );
};

export default JournalDetailPage;
