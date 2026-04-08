"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addMovieLocalizedTitle,
  updateMovieLocalizedTitle,
  deleteMovieLocalizedTitle,
} from "@/actions/movies";
import {
  addTvLocalizedTitle,
  updateTvLocalizedTitle,
  deleteTvLocalizedTitle,
} from "@/actions/tvShows";

const LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "mr", label: "Marathi" },
  { code: "pa", label: "Punjabi" },
  { code: "bn", label: "Bengali" },
  { code: "or", label: "Odia" },
  { code: "gu", label: "Gujarati" },
  { code: "as", label: "Assamese" },
  { code: "en", label: "English" },
  { code: "other", label: "Other" },
];

interface LocalizedEntry {
  id: number;
  language: string | null;
  title: string;
  description: string | null;
}

interface EntryState {
  language: string;
  title: string;
  description: string;
}

interface Props {
  type: "movie" | "tv";
  contentId: number;
  entries: LocalizedEntry[];
}

function empty(): EntryState {
  return { language: "", title: "", description: "" };
}

function langLabel(code: string | null): string {
  if (!code) return "-";
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export function LocalizedContentForm({ type, contentId, entries }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EntryState>(empty());
  const [addState, setAddState] = useState<EntryState>(empty());
  const [showAdd, setShowAdd] = useState(false);

  function startEdit(e: LocalizedEntry) {
    setEditingId(e.id);
    setEditState({ language: e.language ?? "", title: e.title, description: e.description ?? "" });
  }

  function saveEdit(id: number) {
    if (!editState.language || !editState.title.trim()) return;
    startTransition(async () => {
      const data = { language: editState.language, title: editState.title.trim(), description: editState.description.trim() || null };
      const result = type === "movie"
        ? await updateMovieLocalizedTitle(id, contentId, data)
        : await updateTvLocalizedTitle(id, contentId, data);
      if (result.success) {
        toast.success("Localized title updated");
        setEditingId(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = type === "movie"
        ? await deleteMovieLocalizedTitle(id, contentId)
        : await deleteTvLocalizedTitle(id, contentId);
      if (result.success) {
        toast.success("Entry removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleAdd() {
    if (!addState.language || !addState.title.trim()) return;
    startTransition(async () => {
      const data = { language: addState.language, title: addState.title.trim(), description: addState.description.trim() || null };
      const result = type === "movie"
        ? await addMovieLocalizedTitle(contentId, data)
        : await addTvLocalizedTitle(contentId, data);
      if (result.success) {
        toast.success("Localized title added");
        setAddState(empty());
        setShowAdd(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {entries.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Language</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) =>
                editingId === e.id ? (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-2 w-36">
                      <Select value={editState.language} onValueChange={(v) => setEditState((s) => ({ ...s, language: v }))}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={editState.title}
                        onChange={(ev) => setEditState((s) => ({ ...s, title: ev.target.value }))}
                        className="h-7 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Textarea
                        value={editState.description}
                        onChange={(ev) => setEditState((s) => ({ ...s, description: ev.target.value }))}
                        className="text-xs min-h-[60px]"
                        rows={2}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" disabled={pending} onClick={() => saveEdit(e.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{langLabel(e.language)}</td>
                    <td className="px-3 py-2">{e.title}</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-sm truncate">{e.description ?? "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(e)}>Edit</Button>
                        <Button size="sm" variant="destructive" disabled={pending} onClick={() => handleDelete(e.id)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No localized titles.</p>
      )}

      {showAdd ? (
        <div className="rounded-md border p-4 space-y-3">
          <h3 className="text-sm font-medium">Add title/description in other language</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Language *</Label>
              <Select value={addState.language} onValueChange={(v) => setAddState((s) => ({ ...s, language: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input
                value={addState.title}
                onChange={(e) => setAddState((s) => ({ ...s, title: e.target.value }))}
                placeholder="Title in selected language"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={addState.description}
              onChange={(e) => setAddState((s) => ({ ...s, description: e.target.value }))}
              placeholder="Synopsis/description in selected language"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={pending || !addState.language || !addState.title.trim()}
            >
              {pending ? "Adding..." : "Add"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowAdd(false); setAddState(empty()); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          Add title/description in other language
        </Button>
      )}
    </div>
  );
}
