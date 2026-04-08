import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@ott/database";
import { Button } from "@/components/ui/button";
import { ProviderDetailsForm } from "@/components/admin/ProviderDetailsForm";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProviderEditPage({ params }: Props) {
  const { id } = await params;
  const providerId = Number(id);

  if (isNaN(providerId)) notFound();

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });

  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/providers">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Providers
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{provider.name}</h1>
        <span className="text-muted-foreground text-sm">#{provider.id}</span>
      </div>

      <ProviderDetailsForm provider={provider} />
    </div>
  );
}
