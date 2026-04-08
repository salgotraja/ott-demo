"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMovieContentRating, updateMovieContentRating, deleteMovieContentRating } from "@/actions/movies";
import { addTvContentRating, updateTvContentRating, deleteTvContentRating } from "@/actions/tvShows";

interface ContentRating {
  id: number;
  country: string;
  code: string;
  type: string;
  releaseDate: Date | null;
  note: string | null;
  language: string | null;
}

interface RatingState {
  country: string;
  code: string;
  type: string;
  releaseDate: string;
  note: string;
  language: string;
}

interface Props {
  type: "movie" | "tv";
  contentId: number;
  ratings: ContentRating[];
}

function toDateStr(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function empty(): RatingState {
  return { country: "", code: "", type: "", releaseDate: "", note: "", language: "" };
}

const FIELDS: { key: keyof RatingState; label: string; inputType?: string; placeholder?: string }[] = [
  { key: "country", label: "Country", placeholder: "IN, US, GB..." },
  { key: "code", label: "Code", placeholder: "A, R, 18+..." },
  { key: "type", label: "Type", placeholder: "certification..." },
  { key: "releaseDate", label: "Release Date", inputType: "date" },
  { key: "note", label: "Note" },
  { key: "language", label: "Language" },
];

export function ContentRatingsForm({ type, contentId, ratings }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<RatingState>(empty());
  const [addState, setAddState] = useState<RatingState>(empty());

  function startEdit(r: ContentRating) {
    setEditingId(r.id);
    setEditState({
      country: r.country,
      code: r.code,
      type: r.type,
      releaseDate: toDateStr(r.releaseDate),
      note: r.note ?? "",
      language: r.language ?? "",
    });
  }

  function toPayload(s: RatingState) {
    return {
      country: s.country.trim(),
      code: s.code.trim(),
      type: s.type.trim(),
      releaseDate: s.releaseDate || null,
      note: s.note.trim() || null,
      language: s.language.trim() || null,
    };
  }

  function saveEdit(id: number) {
    if (!editState.country.trim() || !editState.code.trim() || !editState.type.trim()) return;
    startTransition(async () => {
      const data = toPayload(editState);
      const result = type === "movie"
        ? await updateMovieContentRating(id, contentId, data)
        : await updateTvContentRating(id, contentId, data);
      if (result.success) {
        toast.success("Rating updated");
        setEditingId(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = type === "movie"
        ? await deleteMovieContentRating(id, contentId)
        : await deleteTvContentRating(id, contentId);
      if (result.success) {
        toast.success("Rating removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleAdd() {
    if (!addState.country.trim() || !addState.code.trim() || !addState.type.trim()) return;
    startTransition(async () => {
      const data = toPayload(addState);
      const result = type === "movie"
        ? await addMovieContentRating(contentId, data)
        : await addTvContentRating(contentId, data);
      if (result.success) {
        toast.success("Rating added");
        setAddState(empty());
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {ratings.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-2 text-left font-medium">{f.label}</th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) =>
                editingId === r.id ? (
                  <tr key={r.id} className="border-b last:border-0">
                    {FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2">
                        <Input
                          type={f.inputType ?? "text"}
                          value={editState[f.key]}
                          onChange={(e) => setEditState((s) => ({ ...s, [f.key]: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" disabled={pending} onClick={() => saveEdit(r.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{r.country}</td>
                    <td className="px-3 py-2">{r.code}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{toDateStr(r.releaseDate) || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.note ?? "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.language ?? "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Edit</Button>
                        <Button size="sm" variant="destructive" disabled={pending} onClick={() => handleDelete(r.id)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No content ratings.</p>
      )}

      <div className="rounded-md border p-4 space-y-3">
        <h3 className="text-sm font-medium">Add Rating</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FIELDS.map(({ key, label, inputType, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                type={inputType ?? "text"}
                value={addState[key]}
                onChange={(e) => setAddState((s) => ({ ...s, [key]: e.target.value }))}
                className="h-8"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <Button
          onClick={handleAdd}
          disabled={pending || !addState.country.trim() || !addState.code.trim() || !addState.type.trim()}
        >
          {pending ? "Adding..." : "Add Rating"}
        </Button>
      </div>
    </div>
  );
}
