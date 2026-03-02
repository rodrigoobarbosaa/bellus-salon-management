import Link from "next/link";

export default function BookingNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-stone-300">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-stone-700">
          Salón no encontrado
        </h2>
        <p className="mt-2 text-stone-500">
          El enlace que seguiste no corresponde a ningún salón registrado.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-stone-800 px-6 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
