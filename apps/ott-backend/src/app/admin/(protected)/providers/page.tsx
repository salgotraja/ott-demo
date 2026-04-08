import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@ott/database";
import { deleteProvider } from "@/actions/providers";
import { DeleteButton } from "@/components/DeleteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/admin/SearchInput";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ProvidersPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : {};

  const providers = await prisma.provider.findMany({
    where,
    orderBy: [{ displayPriority: "asc" }, { name: "asc" }],
    select: { id: true, name: true, logoPath: true, displayPriority: true },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Providers</CardTitle>
            <CardDescription>Manage streaming providers available in India.</CardDescription>
          </div>
          <Badge variant="secondary">{providers.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense>
          <SearchInput placeholder="Search providers..." />
        </Suspense>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Priority</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">{p.id}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.displayPriority ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/providers/${p.id}`}>Edit</Link>
                    </Button>
                    <DeleteButton
                      message={`Delete provider "${p.name}"? This cannot be undone.`}
                      action={async () => {
                        "use server";
                        return deleteProvider(p.id);
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
