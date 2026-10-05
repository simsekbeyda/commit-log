import { Chip, Stack } from '@mui/material';
import { MONO_FONT } from '../theme';

/** Tıklanabilir #etiket listesi; tıklama kartın kendi tıklamasını tetiklemez. */
const TagChips = ({ tags = [], onClick, max, size = 'small', sx }) => {
    if (!tags.length) return null;
    const visible = max ? tags.slice(0, max) : tags;
    const hidden = tags.length - visible.length;
    return (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={sx}>
            {visible.map((tag) => (
                <Chip
                    key={tag}
                    label={`#${tag}`}
                    size={size}
                    variant="outlined"
                    color="primary"
                    onClick={
                        onClick
                            ? (e) => {
                                  e.stopPropagation();
                                  onClick(tag);
                              }
                            : undefined
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{ fontFamily: MONO_FONT, fontSize: 12 }}
                />
            ))}
            {hidden > 0 && <Chip label={`+${hidden}`} size={size} sx={{ fontFamily: MONO_FONT, fontSize: 12 }} />}
        </Stack>
    );
};

export default TagChips;
