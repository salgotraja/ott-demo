"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProvider } from "@/actions/providers";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  logoPath: z.string().nullable(),
  displayPriority: z.coerce.number().int().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
  displayPriority: number | null;
}

const TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/w92";

export function ProviderDetailsForm({ provider }: { provider: Provider }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: provider.name,
      logoPath: provider.logoPath,
      displayPriority: provider.displayPriority,
    },
  });

  const logoPath = form.watch("logoPath");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateProvider(provider.id, values);
      if (result.success) {
        toast.success("Provider updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        {logoPath && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Logo Preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${TMDB_LOGO_BASE}${logoPath}`}
              alt={provider.name}
              className="h-12 w-auto rounded bg-white p-1"
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo Path</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="/abc123.png" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayPriority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Priority</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
