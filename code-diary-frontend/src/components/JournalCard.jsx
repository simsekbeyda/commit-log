import { useState } from 'react';
import {
    Box,
    Card,
    CardActionArea,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { useNavigate } from 'react-router-dom';
import { MONO_FONT } from '../theme';
import { formatDate, formatRelative, readingMinutes } from '../utils/format';
import TagChips from './TagChips';
import { useI18n } from '../i18n/I18nProvider';

const JournalCard = ({ journal, onDelete, onTagClick }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const { lang, t } = useI18n();

    const closeMenu = () => setAnchorEl(null);
    const go = (path) => {
        closeMenu();
        navigate(path);
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'border-color .2s, box-shadow .2s, transform .2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: (t) => `0 12px 32px -12px ${alpha(t.palette.primary.main, 0.35)}`,
                },
            }}
        >
            <CardActionArea
                onClick={() => navigate(`/journals/${journal.id}`)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 3, pb: 2 }}
            >
                <Typography
                    variant="caption"
                    color="primary"
                    sx={{ fontFamily: MONO_FONT, fontWeight: 500, mb: 1, pr: 5 }}
                >
                    {'// '}
                    {formatDate(journal.createdAt, lang)}
                </Typography>
                <Typography variant="h6" sx={{ lineHeight: 1.3, mb: 1, pr: 4 }}>
                    {journal.title}
                </Typography>
                <Typography
                    color="text.secondary"
                    sx={{
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                    }}
                >
                    {journal.content}
                </Typography>
                <TagChips tags={journal.tags} max={3} onClick={onTagClick} sx={{ mt: 2 }} />
                <Stack direction="row" spacing={2} sx={{ mt: 2, color: 'text.secondary' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <ScheduleRoundedIcon sx={{ fontSize: 15 }} />
                        <Typography variant="caption">
                            {t('card.readTime', { n: readingMinutes(journal.content) })}
                        </Typography>
                    </Stack>
                    <Typography variant="caption">
                        {t('card.updated', { time: formatRelative(journal.updatedAt, lang) ?? t('time.justNow') })}
                    </Typography>
                </Stack>
            </CardActionArea>

            <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                <Tooltip title={t('card.analyze')}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/journals/${journal.id}?tab=summary`)}
                        aria-label={t('card.analyze')}
                    >
                        <AutoAwesomeOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} aria-label={t('card.more')}>
                    <MoreHorizRoundedIcon fontSize="small" />
                </IconButton>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => go(`/edit/${journal.id}`)}>
                    <ListItemIcon>
                        <EditOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    {t('common.edit')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        closeMenu();
                        onDelete(journal);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon>
                        <DeleteOutlineRoundedIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    {t('common.delete')}
                </MenuItem>
            </Menu>
        </Card>
    );
};

export default JournalCard;
