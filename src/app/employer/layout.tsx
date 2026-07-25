// Public layout — no auth check
// Applies to /employer (landing) and /employer/register
export default function EmployerPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
