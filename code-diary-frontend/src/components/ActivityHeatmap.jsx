import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import { getActivity } from '../services/journalService';
import { useI18n } from '../i18n/I18nProvider';
import { MONO_FONT } from '../theme';
import { formatDate } from '../utils/format';

const DAYS = 365;
const GAP = 3;
// Hücreler genişliğe göre büyür; dar ekranda en az MIN_CELL olur ve yatay kaydırma açılır
const MIN_CELL = 10;
const MAX_CELL = 20;
const LEVEL_ALPHA = [0, 0.35, 0.6, 1];

/** "2026-10-05" → yerel saatle Date (UTC'ye kaymasın diye elle ayrıştırılır). */
const parseDate = (value) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const toKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Haftalar sütun, günler (Pazartesi→Pazar) satır olacak şekilde ızgara oluşturur. */
export const buildWeeks = (from, to) => {
    const start = parseDate(from);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // haftanın pazartesisine hizala
    const end = parseDate(to);
    const weeks = [];
    for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        if ((day.getDay() + 6) % 7 === 0) weeks.push([]);
        weeks[weeks.length - 1].push(new Date(day) >= parseDate(from) ? toKey(day) : null);
    }
    return weeks;
};

const Cell = ({ level, size }) => (
    <Box
        sx={{
            width: size ?? '100%',
            aspectRatio: '1 / 1',
            borderRadius: '3px',
            bgcolor: (t) => (level === 0 ? t.palette.action.hover : alpha(t.palette.primary.main, LEVEL_ALPHA[level])),
        }}
    />
);

const Stat = ({ children, highlight }) => (
    <Typography
        variant="body2"
        sx={{ fontFamily: MONO_FONT, fontSize: 12.5, color: highlight ? 'text.primary' : 'text.secondary' }}
    >
        {children}
    </Typography>
);

const ActivityHeatmap = () => {
    const { lang, t } = useI18n();
    const [activity, setActivity] = useState(null);

    useEffect(() => {
        getActivity(DAYS)
            .then((res) => setActivity(res.data))
            .catch(() => setActivity(false));
    }, []);

    const { weeks, counts } = useMemo(() => {
        if (!activity) return { weeks: [], counts: {} };
        return {
            weeks: buildWeeks(activity.from, activity.to),
            counts: Object.fromEntries(activity.days.map((d) => [d.date, d.count])),
        };
    }, [activity]);

    if (activity === false) return null;
    if (!activity) return <Skeleton variant="rounded" height={170} sx={{ borderRadius: 1.5, mb: 3 }} />;

    const monthFormatter = new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });

    return (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 1.5, mb: 3 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={1}
                sx={{ mb: 2 }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalFireDepartmentRoundedIcon
                        sx={{ color: activity.currentStreak > 0 ? 'warning.main' : 'text.disabled' }}
                    />
                    <Typography fontWeight={700}>{t('activity.streak', { n: activity.currentStreak })}</Typography>
                </Stack>
                <Stack direction="row" columnGap={2} rowGap={0.5} flexWrap="wrap">
                    <Stat>{t('activity.longest', { n: activity.longestStreak })}</Stat>
                    <Stat>{t('activity.activeDays', { n: activity.activeDays })}</Stat>
                </Stack>
            </Stack>

            {/* Dar ekranlarda yatay kaydırılır; en yeni haftalar sağda olduğu için sona kaydırılmış başlar */}
            <Box sx={{ overflowX: 'auto', pb: 0.5, direction: 'rtl' }} role="img" aria-label={t('activity.title')}>
                <Box
                    sx={{
                        direction: 'ltr',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${weeks.length}, minmax(${MIN_CELL}px, 1fr))`,
                        gridTemplateRows: '16px',
                        gap: `${GAP}px`,
                        minWidth: weeks.length * (MIN_CELL + GAP),
                        maxWidth: weeks.length * (MAX_CELL + GAP),
                        ml: 'auto',
                    }}
                >
                    {weeks.map((week, i) => {
                        const first = week.find(Boolean);
                        const showMonth = first && parseDate(first).getDate() <= 7;
                        return (
                            <Box key={`m${i}`} sx={{ gridColumn: i + 1, gridRow: 1, position: 'relative' }}>
                                {showMonth && (
                                    <Typography
                                        component="span"
                                        sx={{ position: 'absolute', fontSize: 10.5, color: 'text.secondary', whiteSpace: 'nowrap' }}
                                    >
                                        {monthFormatter.format(parseDate(first))}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                    {weeks.map((week, i) =>
                        week.map((day, j) => {
                            const position = { gridColumn: i + 1, gridRow: j + 2 };
                            if (!day) return <Box key={`e${i}-${j}`} sx={position} />;
                            const count = counts[day] || 0;
                            const label = formatDate(parseDate(day), lang);
                            return (
                                <Tooltip
                                    key={day}
                                    title={
                                        count
                                            ? t('activity.tooltip', { date: label, n: count })
                                            : t('activity.tooltipNone', { date: label })
                                    }
                                    disableInteractive
                                >
                                    <Box data-testid="heatmap-day" sx={position}>
                                        <Cell level={Math.min(count, 3)} />
                                    </Box>
                                </Tooltip>
                            );
                        }),
                    )}
                </Box>
            </Box>

            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mr: 0.5 }}>{t('activity.less')}</Typography>
                {[0, 1, 2, 3].map((level) => (
                    <Cell key={level} level={level} size={11} />
                ))}
                <Typography sx={{ fontSize: 11, color: 'text.secondary', ml: 0.5 }}>{t('activity.more')}</Typography>
            </Stack>
        </Paper>
    );
};

export default ActivityHeatmap;
