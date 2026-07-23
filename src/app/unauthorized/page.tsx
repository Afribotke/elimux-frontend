export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md mx-4">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-6">
          You do not have permission to access this page. 
          If you believe this is an error, please contact support.
        </p>
        <a href="/" className="text-emerald-600 hover:underline font-medium">
          Return to Homepage
        </a>
      </div>
    </div>
  );
}
