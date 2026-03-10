// src/app/[locale]/login/page.tsx
import { generatePageMetadata } from '@/app/[locale]/layout';
import LoginClient from "./LoginClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'login');
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  return <LoginClient locale={locale} />;
}
