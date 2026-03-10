// src/app/[locale]/register/page.tsx
import { generatePageMetadata } from '@/app/[locale]/layout';
import RegisterClient from "./RegisterClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'register');
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  return <RegisterClient locale={locale} />;
}
