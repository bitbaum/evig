/**
 * next-intl mock for tests.
 *
 * useTranslations returns a function that returns the translation key,
 * allowing components to render without a NextIntlClientProvider.
 * Tests that need specific translated text should pass it as props or
 * mock this module locally with vi.mock('next-intl', ...).
 */
import React from 'react';
import { vi } from 'vitest';

export const useTranslations = (_namespace) => (key, _params) => key;

export const useLocale = () => 'de';

export const useMessages = () => ({});

export const useFormatter = () => ({
  dateTime: (date) => String(date),
  number: (n) => String(n),
  relativeTime: (date) => String(date),
  list: (items) => items.join(', '),
});

export const NextIntlClientProvider = ({ children }) => children;

export const getTranslations = async (_namespace) => (key, _params) => key;

export const getMessages = async () => ({});

export const getLocale = async () => 'de';

export const defineRouting = (config) => config;

export const createNavigation = (_routing) => {
  const Link = ({ href, children, className, ...props }) =>
    React.createElement(
      'a',
      { href: typeof href === 'string' ? href : (href?.pathname ?? '#'), className, ...props },
      children,
    );
  const redirect = vi.fn();
  const usePathname = () => '/';
  const useRouter = () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() });
  const getPathname = ({ href }) => (typeof href === 'string' ? href : (href?.pathname ?? '/'));
  return { Link, redirect, usePathname, useRouter, getPathname };
};
