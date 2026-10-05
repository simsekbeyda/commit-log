import { useEffect, useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate, useParams } from 'react-router-dom';
import JournalForm from '../components/JournalForm';
import { ErrorState } from '../components/StatusState';
import { createJournal, getJournalById, getTags, updateJournal } from '../services/journalService';
import { getErrorMessage } from '../services/apiClient';
import { useNotify } from '../context/AppProviders';
import { MONO_FONT } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

/** Yeni günlük oluşturma (/new) ve düzenleme (/edit/:id) için ortak sayfa. */
const JournalFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const notify = useNotify();
    const { t } = useI18n();

    const [initialValues, setInitialValues] = useState(isEdit ? null : { title: '', content: '', tags: [] });
    const [tagOptions, setTagOptions] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (!isEdit) return;
        getJournalById(id)
            .then((res) =>
                setInitialValues({ title: res.data.title, content: res.data.content, tags: res.data.tags ?? [] }),
            )
            .catch((err) => setLoadError(getErrorMessage(err)));
    }, [id, isEdit]);

    useEffect(() => {
        getTags()
            .then((res) => setTagOptions(res.data.map((item) => item.tag)))
            .catch(() => setTagOptions([]));
    }, []);

    const handleSubmit = async (values) => {
        setServerError('');
        try {
            const res = isEdit ? await updateJournal(id, values) : await createJournal(values);
            notify(t(isEdit ? 'toast.updated' : 'toast.saved'));
            navigate(`/journals/${res.data.id}`);
        } catch (err) {
            setServerError(getErrorMessage(err));
        }
    };

    const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

    return (
        <Box sx={{ maxWidth: 820, mx: 'auto' }}>
            <Box sx={{ mb: 3 }}>
                <Button startIcon={<ArrowBackRoundedIcon />} color="inherit" onClick={goBack}>
                    {t('common.back')}
                </Button>
            </Box>
            <Typography
                variant="overline"
                color="primary"
                sx={{ display: 'block', fontFamily: MONO_FONT, fontWeight: 500, textTransform: 'none' }}
            >
                {isEdit ? '$ git commit --amend' : '$ git commit'}
            </Typography>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                {t(isEdit ? 'form.editTitle' : 'form.newTitle')}
            </Typography>

            {loadError ? (
                <ErrorState message={loadError} />
            ) : !initialValues ? (
                <Skeleton variant="rounded" height={420} sx={{ borderRadius: 1.5 }} />
            ) : (
                <JournalForm
                    initialValues={initialValues}
                    tagOptions={tagOptions}
                    submitLabel={t(isEdit ? 'form.saveChanges' : 'form.save')}
                    onSubmit={handleSubmit}
                    onCancel={goBack}
                    serverError={serverError}
                />
            )}
        </Box>
    );
};

export default JournalFormPage;
