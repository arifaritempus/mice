export default function QuoteViewPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-transparent">{children}</div>;
}
