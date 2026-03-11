import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware({
  ...routing,
  localePrefix: 'always',
  localeDetection: false
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
