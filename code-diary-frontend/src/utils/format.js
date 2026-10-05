const LOCALES = { tr: 'tr-TR', en: 'en-US' };

const toLocale = (lang) => LOCALES[lang] || LOCALES.en;

export const formatDate = (value, lang) =>
    value
        ? new Intl.DateTimeFormat(toLocale(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(
              new Date(value),
          )
        : '';

export const formatDateTime = (value, lang) =>
    value
        ? new Intl.DateTimeFormat(toLocale(lang), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          }).format(new Date(value))
        : '';

const UNITS = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
];

/** "3 gün önce" / "3 days ago"; bir dakikadan kısa süreler için null döner. */
export const formatRelative = (value, lang) => {
    if (!value) return null;
    const diffSeconds = (new Date(value).getTime() - Date.now()) / 1000;
    const formatter = new Intl.RelativeTimeFormat(toLocale(lang), { numeric: 'auto' });
    for (const [unit, seconds] of UNITS) {
        if (Math.abs(diffSeconds) >= seconds) {
            return formatter.format(Math.round(diffSeconds / seconds), unit);
        }
    }
    return null;
};

export const countWords = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

export const readingMinutes = (text = '') => Math.max(1, Math.round(countWords(text) / 200));
