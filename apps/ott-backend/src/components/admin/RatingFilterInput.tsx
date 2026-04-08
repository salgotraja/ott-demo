"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";

export function RatingFilterInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("rating", value);
      } else {
        params.delete("rating");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <Input
      type="search"
      placeholder="Filter by content rating (U, UA, A...)"
      defaultValue={searchParams.get("rating") ?? ""}
      onChange={handleChange}
      className="max-w-sm"
    />
  );
}
