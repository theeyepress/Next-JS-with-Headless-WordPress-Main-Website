import { generatePageMetadata } from '@/app/[locale]/layout';
import ContactClient from './ContactClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'contact');
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  return <ContactClient locale={locale} />;
}
