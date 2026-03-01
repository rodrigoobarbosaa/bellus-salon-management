export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Bellus</h1>
          <p className="mt-1 text-sm text-stone-500">Gestión de salón de belleza</p>
        </div>
        {children}
      </div>
    </div>
  );
}
