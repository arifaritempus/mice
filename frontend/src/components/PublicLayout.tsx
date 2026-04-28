'use client';

import { usePathname } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import ColorThemeApplier from '@/components/ColorThemeApplier';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AuthWrapper tüm authentication ve permission kontrollerini yapar
  return (
    <>
      <ColorThemeApplier />
      <AuthWrapper>{children}</AuthWrapper>
    </>
  );
}

