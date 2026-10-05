import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translations } from './translations';
import { setApiLanguage } from '../services/apiClient';

const STORAGE_KEY = 'code-diary-lang';

const detectLanguage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (LANGUAGES.includes(stored)) return stored;
    } catch {
        // localStorage erişilemezse tarayıcı diline düş
    }
    return navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
};

/**
 * Anahtarı seçili dile çevirir ve {değişken} yer tutucularını doldurur.
 * Değişkenlerden biri React öğesiyse sonuç bir öğe listesi olarak döner.
 */
export const translate = (lang, key, vars = {}) => {
    const template = translations[lang]?.[key] ?? translations.en[key] ?? key;
    const parts = template.split(/\{(\w+)\}/);
    if (parts.length === 1) return template;

    const values = parts.map((part, i) => (i % 2 === 1 ? (vars[part] ?? `{${part}}`) : part));
    if (values.every((v) => typeof v === 'string' || typeof v === 'number')) {
        return values.join('');
    }
    return values.map((v, i) => <Fragment key={i}>{v}</Fragment>);
};

// Provider dışında (ör. bileşen testleri) Türkçe metinler kullanılır
const I18nContext = createContext({ lang: 'tr', setLang: () => {}, t: (key, vars) => translate('tr', key, vars) });

export const I18nProvider = ({ children, initialLang }) => {
    const [lang, setLangState] = useState(() => initialLang || detectLanguage());

    // apiClient senkron güncellensin ki ilk istekler de doğru Accept-Language ile gitsin
    setApiLanguage(lang);

    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const setLang = useCallback((next) => {
        setLangState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // tercih sadece bu oturumda geçerli olur
        }
    }, []);

    const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
    const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
