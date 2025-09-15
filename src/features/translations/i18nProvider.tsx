import { createContext, useContext } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { I18n } from './i18n';

const TranslationContext = createContext<I18n>(I18n.getInstance());
export const addTranslations = I18n.addTranslations.bind(I18n);
export const useI18n = () => useContext(TranslationContext);
export const I18nProvider: FC<PropsWithChildren> = ({ children }) => (
  <TranslationContext.Provider value={I18n.getInstance()}>
    {children}
  </TranslationContext.Provider>
);