import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useI18n } from '../i18n/I18nProvider';

const ConfirmDialog = ({ open, title, message, confirmLabel, loading = false, onConfirm, onClose }) => {
    const { t } = useI18n();
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    {t('common.cancel')}
                </Button>
                <Button onClick={onConfirm} disabled={loading} variant="contained" color="error">
                    {loading ? t('common.deleting') : (confirmLabel ?? t('common.delete'))}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
