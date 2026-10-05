import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState } from '../components/StatusState';
import { useI18n } from '../i18n/I18nProvider';

const NotFoundPage = () => {
    const { t } = useI18n();
    return (
        <EmptyState
            icon="404"
            title={t('notFound.title')}
            description={t('notFound.desc')}
            action={
                <Button component={RouterLink} to="/" variant="contained">
                    {t('notFound.action')}
                </Button>
            }
        />
    );
};

export default NotFoundPage;
