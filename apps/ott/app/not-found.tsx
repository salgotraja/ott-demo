import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="max-w-md space-y-6 rounded-lg bg-zinc-900 p-8 text-center">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
        <p className="text-zinc-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
