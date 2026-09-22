import type { Metadata } from 'next';
import { PrivacyNotice } from '@/components/PrivacyNotice';

export const metadata: Metadata = { title: 'Privacy notice' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-6 text-3xl">Privacy notice</h1>
      <PrivacyNotice />
    </main>
  );
}
