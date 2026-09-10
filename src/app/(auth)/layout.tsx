export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white selection:bg-amber-900/20">
      {children}
    </div>
  );
}
