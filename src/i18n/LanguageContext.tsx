import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TranslationDict } from './types';
import { zh } from './locales/zh';
import { en } from './locales/en';

const LANGUAGE_STORAGE_KEY = 'mathmind_language_v1';

const dictionaries: Record<Language, TranslationDict> = { zh, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') return saved;
      if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.toLowerCase().startsWith('zh')) {
        return 'en';
      }
    } catch {
      // fallback
    }
    return 'zh';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  }, []);

  const t = useCallback((keyPath: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[language] || dictionaries.zh;
    const parts = keyPath.split('.');
    let current: any = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to zh
        let fallback: any = dictionaries.zh;
        for (const p of parts) {
          if (fallback && typeof fallback === 'object' && p in fallback) {
            fallback = fallback[p];
          } else {
            fallback = null;
            break;
          }
        }
        current = fallback || keyPath;
        break;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    if (params) {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`\\{\\s*${k}\\s*\\}`, 'g'), String(v));
      }, current);
    }

    return current;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
