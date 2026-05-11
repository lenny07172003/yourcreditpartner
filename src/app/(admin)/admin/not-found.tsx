import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <p className="text-6xl font-bold text-line">404</p>
        <h1 className="mt-4 text-xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This page doesn't exist or has been moved.
        </p>
        <Link
          href="/admin"
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
