import { generatePageMetadata } from '@/app/[locale]/layout';
import PrivacyClient from './PrivacyClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'privacy');
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  return <PrivacyClient locale={locale} />;
}
