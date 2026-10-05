import { useState } from 'react';
import { Alert, Autocomplete, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import { MONO_FONT } from '../theme';
import { countWords } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';

const TITLE_MAX = 100;
const CONTENT_MIN = 20;
const CONTENT_MAX = 10000;
const TAGS_MAX = 10;

/** Backend ile aynı kural: küçük harf, baştaki # atılır, boşluk → tire. */
export const normalizeTag = (tag) =>
    tag.trim().replace(/^#+/, '').toLocaleLowerCase('tr').replace(/\s+/g, '-').slice(0, 30);

const validate = ({ title, content }, t) => {
    const errors = {};
    if (!title.trim()) errors.title = t('form.error.titleRequired');
    else if (title.length > TITLE_MAX) errors.title = t('form.error.titleMax', { max: TITLE_MAX });
    if (content.trim().length < CONTENT_MIN) errors.content = t('form.error.contentMin', { min: CONTENT_MIN });
    else if (content.length > CONTENT_MAX) errors.content = t('form.error.contentMax', { max: CONTENT_MAX });
    return errors;
};

const JournalForm = ({
    initialValues = { title: '', content: '', tags: [] },
    tagOptions = [],
    submitLabel,
    onSubmit,
    onCancel,
    serverError,
}) => {
    const [values, setValues] = useState({ tags: [], ...initialValues });
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const { t } = useI18n();

    const errors = validate(values, t);
    const showError = (field) => touched[field] && errors[field];

    const handleChange = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));
    const handleBlur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setTouched({ title: true, content: true });
        if (Object.keys(errors).length > 0 || submitting) return;
        setSubmitting(true);
        try {
            await onSubmit({ title: values.title.trim(), content: values.content.trim(), tags: values.tags });
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
    };

    return (
        <Paper
            variant="outlined"
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 1.5 }}
        >
            {serverError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {serverError}
                </Alert>
            )}

            <TextField
                label={t('form.title.label')}
                placeholder={t('form.title.placeholder')}
                fullWidth
                autoFocus
                value={values.title}
                onChange={handleChange('title')}
                onBlur={handleBlur('title')}
                error={Boolean(showError('title'))}
                helperText={showError('title') || `${values.title.length}/${TITLE_MAX}`}
                slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
                sx={{ mb: 3 }}
            />

            <TextField
                label={t('form.content.label')}
                placeholder={t('form.content.placeholder')}
                fullWidth
                multiline
                minRows={10}
                value={values.content}
                onChange={handleChange('content')}
                onBlur={handleBlur('content')}
                onKeyDown={handleKeyDown}
                error={Boolean(showError('content'))}
                helperText={showError('content') || ' '}
                slotProps={{ htmlInput: { maxLength: CONTENT_MAX } }}
                sx={{ '& textarea': { lineHeight: 1.7 } }}
            />

            <Autocomplete
                multiple
                freeSolo
                options={tagOptions.filter((option) => !values.tags.includes(option))}
                value={values.tags}
                onChange={(_, next) => {
                    const tags = [...new Set(next.map(normalizeTag).filter(Boolean))].slice(0, TAGS_MAX);
                    setValues((prev) => ({ ...prev, tags }));
                }}
                renderValue={(tags, getItemProps) =>
                    tags.map((tag, index) => {
                        const { key, ...itemProps } = getItemProps({ index });
                        return (
                            <Chip
                                key={key}
                                label={`#${tag}`}
                                size="small"
                                sx={{ fontFamily: MONO_FONT }}
                                {...itemProps}
                            />
                        );
                    })
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t('tags.label')}
                        placeholder={values.tags.length < TAGS_MAX ? t('tags.placeholder') : ''}
                        helperText={t('tags.helper')}
                    />
                )}
                sx={{ mt: 1 }}
            />

            <Stack
                direction={{ xs: 'column-reverse', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                sx={{ mt: 2 }}
            >
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO_FONT }}>
                    {t('form.stats', {
                        words: countWords(values.content),
                        chars: values.content.length,
                        max: CONTENT_MAX,
                    })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Button color="inherit" onClick={onCancel} disabled={submitting}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="contained" disabled={submitting}>
                        {submitting ? t('form.saving') : submitLabel}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
};

export default JournalForm;
