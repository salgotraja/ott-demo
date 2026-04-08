"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  linkProviderToMovie,
  unlinkProviderFromMovie,
  linkProviderToTvShow,
  unlinkProviderFromTvShow,
} from "@/actions/movieProviders";

interface Provider {
  id: number;
  name: string;
}

interface LinkedProvider {
  providerId: number;
  type: string;
  region: string;
  url: string | null;
  cost: string | null;
  quality: string | null;
  provider: Provider;
}

interface EditState {
  url: string;
  cost: string;
  quality: string;
}

interface Props {
  type: "movie" | "tv";
  id: number;
  allProviders: Provider[];
  linkedProviders: LinkedProvider[];
}

const PROVIDER_TYPES = ["flatrate", "rent", "buy", "free", "ads"];

function rowKey(lp: LinkedProvider): string {
  return `${lp.providerId}-${lp.type}-${lp.region}`;
}

export function ProvidersForm({ type, id, allProviders, linkedProviders }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ url: "", cost: "", quality: "" });
  const [addProviderId, setAddProviderId] = useState<string>("");
  const [addType, setAddType] = useState<string>("flatrate");
  const [addUrl, setAddUrl] = useState("");
  const [addCost, setAddCost] = useState("");
  const [addQuality, setAddQuality] = useState("");

  function startEdit(lp: LinkedProvider) {
    setEditingKey(rowKey(lp));
    setEditState({ url: lp.url ?? "", cost: lp.cost ?? "", quality: lp.quality ?? "" });
  }

  function saveEdit(lp: LinkedProvider) {
    startTransition(async () => {
      const url = editState.url || undefined;
      const cost = editState.cost || undefined;
      const quality = editState.quality || undefined;
      const result = type === "movie"
        ? await linkProviderToMovie(id, lp.providerId, lp.type, lp.region, url, cost, quality)
        : await linkProviderToTvShow(id, lp.providerId, lp.type, lp.region, url, cost, quality);
      if (result.success) {
        toast.success("Provider updated");
        setEditingKey(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleAdd() {
    if (!addProviderId) return;
    startTransition(async () => {
      const result = type === "movie"
        ? await linkProviderToMovie(id, Number(addProviderId), addType, "IN", addUrl || undefined, addCost || undefined, addQuality || undefined)
        : await linkProviderToTvShow(id, Number(addProviderId), addType, "IN", addUrl || undefined, addCost || undefined, addQuality || undefined);
      if (result.success) {
        toast.success("Provider linked");
        setAddProviderId("");
        setAddUrl("");
        setAddCost("");
        setAddQuality("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(lp: LinkedProvider) {
    startTransition(async () => {
      const result = type === "movie"
        ? await unlinkProviderFromMovie(id, lp.providerId, lp.type, lp.region)
        : await unlinkProviderFromTvShow(id, lp.providerId, lp.type, lp.region);
      if (result.success) {
        toast.success("Provider removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {linkedProviders.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Provider</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Region</th>
                <th className="px-4 py-2 text-left font-medium">URL</th>
                <th className="px-4 py-2 text-left font-medium">Cost</th>
                <th className="px-4 py-2 text-left font-medium">Quality</th>
                <th className="px-4 py-2 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linkedProviders.map((lp) =>
                editingKey === rowKey(lp) ? (
                  <tr key={rowKey(lp)} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{lp.provider.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">{lp.type}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{lp.region}</td>
                    <td className="px-4 py-2">
                      <Input
                        value={editState.url}
                        onChange={(e) => setEditState((s) => ({ ...s, url: e.target.value }))}
                        className="h-7 text-xs w-48"
                        placeholder="https://..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={editState.cost}
                        onChange={(e) => setEditState((s) => ({ ...s, cost: e.target.value }))}
                        className="h-7 text-xs w-28"
                        placeholder="₹199/mo"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={editState.quality}
                        onChange={(e) => setEditState((s) => ({ ...s, quality: e.target.value }))}
                        className="h-7 text-xs w-20"
                        placeholder="HD, 4K"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" disabled={pending} onClick={() => saveEdit(lp)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={rowKey(lp)} className="border-b last:border-0">
                    <td className="px-4 py-2">{lp.provider.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">{lp.type}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{lp.region}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-48">
                      {lp.url ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{lp.cost ?? "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{lp.quality ?? "-"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(lp)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() => handleRemove(lp)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No providers linked.</p>
      )}

      <div className="border rounded-md p-4 space-y-4">
        <h3 className="font-medium text-sm">Add Provider</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Provider</Label>
            <Select value={addProviderId} onValueChange={setAddProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {allProviders.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={addType} onValueChange={setAddType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>URL (optional)</Label>
            <Input value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label>Cost (optional)</Label>
            <Input value={addCost} onChange={(e) => setAddCost(e.target.value)} placeholder="₹199/month" />
          </div>
          <div className="space-y-1">
            <Label>Quality (optional)</Label>
            <Input value={addQuality} onChange={(e) => setAddQuality(e.target.value)} placeholder="HD, 4K..." />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={pending || !addProviderId}>
          {pending ? "Adding..." : "Add Provider"}
        </Button>
      </div>
    </div>
  );
}
