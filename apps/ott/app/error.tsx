"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="max-w-md space-y-6 rounded-lg bg-zinc-900 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
        <p className="text-zinc-400">
          An error occurred while loading this page. Please try again.
        </p>
        {error.message && (
          <p className="text-sm text-zinc-500">{error.message}</p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md bg-zinc-800 px-6 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
