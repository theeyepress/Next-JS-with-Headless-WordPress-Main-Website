import { generatePageMetadata } from '@/app/[locale]/layout';
import SubscribePageClient from './SubscribePageClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'subscribe');
}

export default async function SubscribePage({ params }: Props) {
  const { locale } = await params;
  return <SubscribePageClient locale={locale} />;
}
