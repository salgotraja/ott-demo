import Link from "next/link";
import { fetchApi, Provider } from "@/lib/api";
import { ProviderLogo } from "@/components/ProviderLogo";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providers = await fetchApi<Provider[]>("/api/public/providers");

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to Movies
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">Streaming Providers</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Available streaming, rental, and purchase providers in India
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {providers.map((provider) => (
            <ProviderLogo
              key={provider.id}
              name={provider.name}
              logoPath={provider.logoPath}
              size="lg"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
