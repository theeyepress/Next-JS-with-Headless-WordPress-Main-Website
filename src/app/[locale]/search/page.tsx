// src/app/[locale]/search/page.tsx
import { generatePageMetadata } from '@/app/[locale]/layout';
import SearchClient from './SearchClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'search');
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  return <SearchClient locale={locale} />;
}
