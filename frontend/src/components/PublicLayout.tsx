"use client";

import ColorThemeApplier from "@/components/ColorThemeApplier";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ColorThemeApplier />
      {children}
    </>
  );
}
