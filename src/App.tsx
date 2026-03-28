/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Forced refresh comment
import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { useCRMStore } from './store/useStore';
import { IconSprite } from './components/Icon';
import { cn } from './utils/cn';
import { AppRoutes } from './routes/AppRoutes';
import { Notification } from './components/Notification';
import './i18n';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { isAuthenticated, theme, language, direction, fetchAppConfig } = useCRMStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppConfig();
    }
  }, [isAuthenticated, fetchAppConfig]);

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    document.documentElement.dir = direction || 'ltr';
    document.documentElement.lang = language || 'en';
  }, [direction, language]);

  if (!isAuthenticated) {
    return (
      <div className={cn("h-screen w-full", theme)}>
        <IconSprite />
        <LoginPage />
        <Notification />
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen w-full bg-[#F8F9FA] overflow-hidden", theme)}>
      <IconSprite />
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        <AppRoutes />
      </main>
      <Notification />
    </div>
  );
}
