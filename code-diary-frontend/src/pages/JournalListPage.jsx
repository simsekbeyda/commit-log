import { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Grid,
    InputAdornment,
    Pagination,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import JournalCard from '../components/JournalCard';
import ActivityHeatmap from '../components/ActivityHeatmap';
import WeeklyReportDialog from '../components/WeeklyReportDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../components/StatusState';
import { deleteJournal, getAllJournals, getJournalStats, getTags } from '../services/journalService';
import { getAiStatus } from '../services/aiService';
import { getErrorMessage } from '../services/apiClient';
import { useNotify } from '../context/AppProviders';
import { MONO_FONT } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

const PAGE_SIZE = 6;

const StatPill = ({ label, value, color = 'default' }) => (
    <Chip
        color={color}
        variant="outlined"
        label={
            <Box component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12.5 }}>
                {label}: <b>{value}</b>
            </Box>
        }
    />
);

const JournalListPage = () => {
    const notify = useNotify();
    const { t } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(0, Number(searchParams.get('page') || 1) - 1);
    const query = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';

    const [searchInput, setSearchInput] = useState(query);
    const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
    const [stats, setStats] = useState(null);
    const [aiMode, setAiMode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [tags, setTags] = useState([]);
    const [weeklyOpen, setWeeklyOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [journalsRes, statsRes, tagsRes] = await Promise.all([
                getAllJournals(page, PAGE_SIZE, query, tag),
                getJournalStats(),
                getTags(),
            ]);
            setData(journalsRes.data);
            setStats(statsRes.data);
            setTags(tagsRes.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [page, query, tag]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        getAiStatus()
            .then((res) => setAiMode(res.data.mode ?? (res.data.configured ? 'openai' : 'off')))
            .catch(() => setAiMode('off'));
    }, []);

    // Tarayıcının geri/ileri tuşuyla değişen aramayı kutuya yansıt
    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    // Arama kutusunu 350ms debounce ile URL'e yansıt
    useEffect(() => {
        if (searchInput === query) return undefined;
        const timer = setTimeout(() => {
            const next = {};
            if (searchInput.trim()) next.q = searchInput.trim();
            if (tag) next.tag = tag;
            setSearchParams(next, { replace: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput, query, tag, setSearchParams]);

    const selectTag = (value) => {
        const next = {};
        if (query) next.q = query;
        if (value && value !== tag) next.tag = value;
        setSearchParams(next);
    };

    const changePage = (_, value) => {
        const next = { page: String(value) };
        if (query) next.q = query;
        if (tag) next.tag = tag;
        setSearchParams(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteJournal(toDelete.id);
            notify(t('toast.deleted'));
            setToDelete(null);
            // Sayfadaki son kayıt silindiyse bir önceki sayfaya dön
            if (data.content.length === 1 && page > 0) {
                changePage(null, page);
            } else {
                void load();
            }
        } catch (err) {
            notify(getErrorMessage(err), 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: { xs: 4, md: 5 } }}>
                <Typography
                    variant="overline"
                    color="primary"
                    sx={{ fontFamily: MONO_FONT, letterSpacing: '0.02em', fontWeight: 500, textTransform: 'none' }}
                >
                    $ git log --journal
                </Typography>
                <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 44 }, mb: 1.5 }}>
                    {t('list.title')}
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 560, fontSize: 17, mb: 2.5 }}>
                    {t('list.subtitle')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    {stats && <StatPill label={t('list.stat.journals')} value={stats.total} />}
                    {aiMode !== null && (
                        <StatPill
                            label="ai"
                            value={t(
                                { openai: 'list.stat.aiOn', demo: 'list.stat.aiDemo' }[aiMode] ?? 'list.stat.aiOff',
                            )}
                            color={{ openai: 'success', demo: 'info' }[aiMode] ?? 'warning'}
                        />
                    )}
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
                        onClick={() => setWeeklyOpen(true)}
                        sx={{ borderRadius: 4 }}
                    >
                        {t('weekly.button')}
                    </Button>
                </Stack>
            </Box>

            <ActivityHeatmap />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder={t('list.search')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button
                    component={RouterLink}
                    to="/new"
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={{ display: { sm: 'none' }, py: 1.5 }}
                >
                    {t('nav.new')}
                </Button>
            </Stack>

            {tags.length > 0 && (
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
                    <Chip
                        label={t('tags.all')}
                        color={tag ? 'default' : 'primary'}
                        variant={tag ? 'outlined' : 'filled'}
                        onClick={() => selectTag('')}
                    />
                    {tags.slice(0, 12).map((item) => (
                        <Chip
                            key={item.tag}
                            label={`#${item.tag} · ${item.count}`}
                            color={item.tag === tag ? 'primary' : 'default'}
                            variant={item.tag === tag ? 'filled' : 'outlined'}
                            onClick={() => selectTag(item.tag)}
                            sx={{ fontFamily: MONO_FONT, fontSize: 12.5 }}
                        />
                    ))}
                </Stack>
            )}

            {(query || tag) && !loading && !error && (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {query
                        ? t('list.results', { q: tag ? `${query} #${tag}` : query, n: data.totalElements })
                        : t('list.tagResults', { tag, n: data.totalElements })}
                </Typography>
            )}

            {error ? (
                <ErrorState message={error} onRetry={load} />
            ) : loading ? (
                <Grid container spacing={2.5}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Grid key={i} size={{ xs: 12, md: 6 }}>
                            <Skeleton variant="rounded" height={210} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : data.content.length === 0 ? (
                query || tag ? (
                    <EmptyState
                        icon="¯\_(ツ)_/¯"
                        title={t('list.noResults.title')}
                        description={t('list.noResults.desc')}
                        action={
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSearchInput('');
                                    setSearchParams({});
                                }}
                            >
                                {t('list.noResults.action')}
                            </Button>
                        }
                    />
                ) : (
                    <EmptyState
                        icon="{ }"
                        title={t('list.empty.title')}
                        description={t('list.empty.desc')}
                        action={
                            <Button component={RouterLink} to="/new" variant="contained" startIcon={<AddRoundedIcon />}>
                                {t('list.empty.action')}
                            </Button>
                        }
                    />
                )
            ) : (
                <>
                    <Grid container spacing={2.5}>
                        {data.content.map((journal) => (
                            <Grid key={journal.id} size={{ xs: 12, md: 6 }}>
                                <JournalCard journal={journal} onDelete={setToDelete} onTagClick={selectTag} />
                            </Grid>
                        ))}
                    </Grid>
                    {data.totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                            <Pagination
                                count={data.totalPages}
                                page={page + 1}
                                onChange={changePage}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </>
            )}

            <WeeklyReportDialog open={weeklyOpen} onClose={() => setWeeklyOpen(false)} />

            <ConfirmDialog
                open={Boolean(toDelete)}
                title={t('delete.title')}
                message={toDelete ? t('delete.named', { title: toDelete.title }) : ''}
                loading={deleting}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </Box>
    );
};

export default JournalListPage;
