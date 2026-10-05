import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    InputAdornment,
    Paper,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import Markdown from './Markdown';
import { askQuestion, getKeywords, getSentiment, getSuggestion, getSummary } from '../services/aiService';
import { getErrorMessage } from '../services/apiClient';
import { MONO_FONT } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

export const AI_TABS = [
    { key: 'summary', fetch: getSummary },
    { key: 'sentiment', fetch: getSentiment },
    { key: 'keywords', fetch: getKeywords },
    { key: 'suggestion', fetch: getSuggestion },
    { key: 'ask' },
];

const SENTIMENTS = {
    positive: { emoji: '😊', color: 'success' },
    negative: { emoji: '😔', color: 'error' },
    neutral: { emoji: '😐', color: 'warning' },
};

const LoadingLines = () => {
    const { t } = useI18n();
    return (
        <Stack spacing={1}>
            <Typography variant="caption" color="primary" sx={{ fontFamily: MONO_FONT, mb: 1 }}>
                {t('ai.thinking')}
            </Typography>
            {[100, 95, 88, 60].map((w) => (
                <Skeleton key={w} variant="text" width={`${w}%`} />
            ))}
        </Stack>
    );
};

const ResultView = ({ tab, data, existingTags = [], onAddTags }) => {
    const { t } = useI18n();
    if (tab === 'sentiment') {
        const code = SENTIMENTS[data] ? data : 'neutral';
        const sentiment = SENTIMENTS[code];
        return (
            <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ fontSize: 44, lineHeight: 1 }}>{sentiment.emoji}</Box>
                <Box>
                    <Chip label={t(`ai.sentiment.${code}`)} color={sentiment.color} sx={{ mb: 1, fontWeight: 700 }} />
                    <Typography color="text.secondary">{t(`ai.sentiment.${code}Text`)}</Typography>
                </Box>
            </Stack>
        );
    }
    if (tab === 'keywords') {
        const newTags = data.filter((keyword) => !existingTags.includes(keyword.replace(/\s+/g, '-')));
        return (
            <Box>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                    {data.map((keyword) => (
                        <Chip
                            key={keyword}
                            label={`#${keyword}`}
                            variant="outlined"
                            color="primary"
                            sx={{ fontFamily: MONO_FONT, fontSize: 13 }}
                        />
                    ))}
                </Stack>
                {onAddTags && newTags.length > 0 && (
                    <Button
                        size="small"
                        startIcon={<LocalOfferOutlinedIcon fontSize="small" />}
                        onClick={() => onAddTags(newTags)}
                        sx={{ mt: 2 }}
                    >
                        {t('ai.keywords.addTags')}
                    </Button>
                )}
            </Box>
        );
    }
    return <Markdown>{data}</Markdown>;
};

const AskTab = ({ journalId, disabled }) => {
    const { t } = useI18n();
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [history, loading]);

    const handleAsk = async (e) => {
        e.preventDefault();
        const trimmed = question.trim();
        if (!trimmed || loading) return;
        setLoading(true);
        setError('');
        try {
            const res = await askQuestion(journalId, trimmed);
            setHistory((prev) => [...prev, { question: trimmed, answer: res.data }]);
            setQuestion('');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {history.length === 0 && !loading && (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {t('ai.ask.hint', { example: <em>{t('ai.ask.example')}</em> })}
                </Typography>
            )}

            <Stack spacing={2} sx={{ mb: 2 }}>
                {history.map((item, idx) => (
                    <Box key={idx}>
                        <Box
                            sx={{
                                ml: 'auto',
                                maxWidth: '85%',
                                width: 'fit-content',
                                px: 2,
                                py: 1,
                                mb: 1,
                                borderRadius: 3,
                                borderBottomRightRadius: 4,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                            }}
                        >
                            {item.question}
                        </Box>
                        <Box sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
                            <Markdown>{item.answer}</Markdown>
                        </Box>
                    </Box>
                ))}
                {loading && <LoadingLines />}
                <div ref={bottomRef} />
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleAsk}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder={t('ai.ask.placeholder')}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={disabled || loading}
                    slotProps={{
                        htmlInput: { maxLength: 500 },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        type="submit"
                                        edge="end"
                                        color="primary"
                                        disabled={disabled || loading || !question.trim()}
                                        aria-label={t('ai.ask.send')}
                                    >
                                        <SendRoundedIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

const AiPanel = ({ journalId, aiConfigured, demoMode = false, activeTab, onTabChange, existingTags, onAddTags }) => {
    const { t } = useI18n();
    const [results, setResults] = useState({});
    const tab = AI_TABS.some((item) => item.key === activeTab) ? activeTab : 'summary';
    const current = results[tab];

    const runTab = useCallback(
        async (key, refresh = false) => {
            const config = AI_TABS.find((item) => item.key === key);
            if (!config?.fetch) return;
            setResults((prev) => ({ ...prev, [key]: { status: 'loading' } }));
            try {
                const res = await config.fetch(journalId, refresh);
                setResults((prev) => ({ ...prev, [key]: { status: 'done', data: res.data } }));
            } catch (err) {
                setResults((prev) => ({ ...prev, [key]: { status: 'error', error: getErrorMessage(err) } }));
            }
        },
        [journalId],
    );

    useEffect(() => {
        if (aiConfigured && tab !== 'ask' && !results[tab]) {
            void runTab(tab);
        }
    }, [aiConfigured, tab, results, runTab]);

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 1.5,
                overflow: 'hidden',
                borderColor: (t) => alpha(t.palette.primary.main, 0.35),
            }}
        >
            <Box
                sx={{
                    px: 3,
                    pt: 2.5,
                    background: (t) =>
                        `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.1)} 0%, transparent 100%)`,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <AutoAwesomeRoundedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>
                        {t('ai.title')}
                    </Typography>
                    {demoMode && (
                        <Tooltip title={t('ai.demo.tooltip')}>
                            <Chip label={t('ai.demo.label')} size="small" color="info" variant="outlined" />
                        </Tooltip>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    {tab !== 'ask' && current?.status !== 'loading' && aiConfigured && (
                        <Tooltip title={t('ai.regenerate')}>
                            <IconButton size="small" onClick={() => runTab(tab, true)} aria-label={t('ai.regenerate')}>
                                <RefreshRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
                <Tabs
                    value={tab}
                    onChange={(_, value) => onTabChange(value)}
                    variant="fullWidth"
                    sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, px: 1, minWidth: 0, fontSize: 13.5 } }}
                >
                    {AI_TABS.map((item) => (
                        <Tab key={item.key} value={item.key} label={t(`ai.tab.${item.key}`)} />
                    ))}
                </Tabs>
            </Box>

            <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', minHeight: 180 }}>
                {!aiConfigured ? (
                    <Alert severity="info">
                        {t('ai.notConfigured', {
                            file: <code>code-diary/.env</code>,
                            key: <code>OPENAI_API_KEY</code>,
                        })}
                    </Alert>
                ) : tab === 'ask' ? (
                    <AskTab journalId={journalId} disabled={!aiConfigured} />
                ) : !current || current.status === 'loading' ? (
                    <LoadingLines />
                ) : current.status === 'error' ? (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => runTab(tab)}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                {t('common.retry')}
                            </Button>
                        }
                    >
                        {current.error}
                    </Alert>
                ) : (
                    <ResultView tab={tab} data={current.data} existingTags={existingTags} onAddTags={onAddTags} />
                )}
            </Box>
        </Paper>
    );
};

export default AiPanel;
