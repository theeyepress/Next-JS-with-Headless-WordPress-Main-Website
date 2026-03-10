import { generatePageMetadata } from '@/app/[locale]/layout';
import TermsClient from './TermsClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'terms');
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  return <TermsClient locale={locale} />;
}
