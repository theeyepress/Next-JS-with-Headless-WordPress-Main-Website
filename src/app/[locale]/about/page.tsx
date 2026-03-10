import { generatePageMetadata } from '@/app/[locale]/layout';
import AboutClient from './AboutClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'about');
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  return <AboutClient locale={locale} />;
}
