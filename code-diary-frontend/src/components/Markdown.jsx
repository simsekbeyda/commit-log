import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { MONO_FONT } from '../theme';

/** AI yanıtları için tema uyumlu Markdown görüntüleyici. */
const Markdown = ({ children }) => (
    <Box
        sx={{
            lineHeight: 1.75,
            '& p': { m: 0, mb: 1.5 },
            '& p:last-child': { mb: 0 },
            '& h3': { fontSize: 16, fontWeight: 700, mt: 2.5, mb: 1 },
            '& h3:first-of-type': { mt: 0 },
            '& ol, & ul': { pl: 2.5, my: 1 },
            '& li': { mb: 1 },
            '& strong': { fontWeight: 600, color: 'text.primary' },
            '& blockquote': { m: 0, pl: 2, borderLeft: 3, borderColor: 'primary.main', color: 'text.secondary' },
            '& code': {
                fontFamily: MONO_FONT,
                fontSize: '0.85em',
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: 'action.hover',
            },
        }}
    >
        <ReactMarkdown>{children}</ReactMarkdown>
    </Box>
);

export default Markdown;
