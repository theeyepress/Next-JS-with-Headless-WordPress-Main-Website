// src/app/[locale]/profile/page.tsx
import { generatePageMetadata } from '@/app/[locale]/layout';
import ProfileClient from "./ProfileClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { locale } = await params;
  return generatePageMetadata(locale, 'profile');
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  return <ProfileClient locale={locale} />;
}
