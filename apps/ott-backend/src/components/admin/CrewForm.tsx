"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { addMovieCrew, updateMovieCrew, deleteMovieCrew } from "@/actions/movies";
import { addTvCrew, updateTvCrew, deleteTvCrew } from "@/actions/tvShows";

interface CrewMember {
  id: number;
  name: string;
  job: string;
  originalName: string | null;
  image: string | null;
  bio: string | null;
  birthName: string | null;
  nickname: string | null;
  height: string | null;
  age: number | null;
  family: string | null;
  trademarks: string | null;
  trivia: string | null;
  quotes: string | null;
  otherWorks: string | null;
}

interface CrewState {
  name: string;
  job: string;
  originalName: string;
  image: string;
  bio: string;
  birthName: string;
  nickname: string;
  height: string;
  age: string;
  family: string;
  trademarks: string;
  trivia: string;
  quotes: string;
  otherWorks: string;
}

interface Props {
  type: "movie" | "tv";
  contentId: number;
  crew: CrewMember[];
}

function empty(): CrewState {
  return {
    name: "", job: "", originalName: "", image: "",
    bio: "", birthName: "", nickname: "", height: "", age: "",
    family: "", trademarks: "", trivia: "", quotes: "", otherWorks: "",
  };
}

function toPayload(s: CrewState) {
  const a = parseInt(s.age, 10);
  return {
    name: s.name.trim(),
    job: s.job.trim(),
    originalName: s.originalName.trim() || null,
    image: s.image.trim() || null,
    bio: s.bio.trim() || null,
    birthName: s.birthName.trim() || null,
    nickname: s.nickname.trim() || null,
    height: s.height.trim() || null,
    age: isNaN(a) ? null : a,
    family: s.family.trim() || null,
    trademarks: s.trademarks.trim() || null,
    trivia: s.trivia.trim() || null,
    quotes: s.quotes.trim() || null,
    otherWorks: s.otherWorks.trim() || null,
  };
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json() as { url: string };
  return data.url;
}

interface EditPanelProps {
  state: CrewState;
  onChange: (update: Partial<CrewState>) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
}

function EditPanel({ state, onChange, onSave, onCancel, pending }: EditPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange({ image: url });
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input value={state.name} onChange={(e) => onChange({ name: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Job *</Label>
          <Input value={state.job} onChange={(e) => onChange({ job: e.target.value })} placeholder="Director, Producer..." className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Original Name</Label>
          <Input value={state.originalName} onChange={(e) => onChange({ originalName: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Birth Name</Label>
          <Input value={state.birthName} onChange={(e) => onChange({ birthName: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nickname</Label>
          <Input value={state.nickname} onChange={(e) => onChange({ nickname: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Height</Label>
          <Input value={state.height} onChange={(e) => onChange({ height: e.target.value })} placeholder="5'11&quot; or 180cm" className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Age</Label>
          <Input type="number" value={state.age} onChange={(e) => onChange({ age: e.target.value })} className="h-8" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Image</Label>
        <div className="flex items-center gap-3">
          {state.image && (
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <Image src={state.image} alt="preview" fill className="object-cover" sizes="48px" />
            </div>
          )}
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={state.image}
              onChange={(e) => onChange({ image: e.target.value })}
              placeholder="Image URL or upload below"
              className="h-8"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Bio</Label>
        <Textarea value={state.bio} onChange={(e) => onChange({ bio: e.target.value })} rows={3} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Family (spouse, children, parents, relatives)</Label>
        <Textarea value={state.family} onChange={(e) => onChange({ family: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Trademarks</Label>
          <Textarea value={state.trademarks} onChange={(e) => onChange({ trademarks: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trivia</Label>
          <Textarea value={state.trivia} onChange={(e) => onChange({ trivia: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notable Quotes</Label>
          <Textarea value={state.quotes} onChange={(e) => onChange({ quotes: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Other Works</Label>
          <Textarea value={state.otherWorks} onChange={(e) => onChange({ otherWorks: e.target.value })} rows={2} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button disabled={pending || !state.name.trim() || !state.job.trim()} onClick={onSave}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function CrewForm({ type, contentId, crew }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<CrewState>(empty());
  const [addState, setAddState] = useState<CrewState>(empty());
  const [showAdd, setShowAdd] = useState(false);

  function startEdit(m: CrewMember) {
    setEditingId(m.id);
    setEditState({
      name: m.name,
      job: m.job,
      originalName: m.originalName ?? "",
      image: m.image ?? "",
      bio: m.bio ?? "",
      birthName: m.birthName ?? "",
      nickname: m.nickname ?? "",
      height: m.height ?? "",
      age: m.age != null ? String(m.age) : "",
      family: m.family ?? "",
      trademarks: m.trademarks ?? "",
      trivia: m.trivia ?? "",
      quotes: m.quotes ?? "",
      otherWorks: m.otherWorks ?? "",
    });
  }

  function saveEdit(id: number) {
    if (!editState.name.trim() || !editState.job.trim()) return;
    startTransition(async () => {
      const result = type === "movie"
        ? await updateMovieCrew(id, contentId, toPayload(editState))
        : await updateTvCrew(id, contentId, toPayload(editState));
      if (result.success) {
        toast.success("Crew member updated");
        setEditingId(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = type === "movie"
        ? await deleteMovieCrew(id, contentId)
        : await deleteTvCrew(id, contentId);
      if (result.success) {
        toast.success("Crew member removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleAdd() {
    if (!addState.name.trim() || !addState.job.trim()) return;
    startTransition(async () => {
      const result = type === "movie"
        ? await addMovieCrew(contentId, toPayload(addState))
        : await addTvCrew(contentId, toPayload(addState));
      if (result.success) {
        toast.success("Crew member added");
        setAddState(empty());
        setShowAdd(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {crew.length > 0 ? (
        <div className="space-y-2">
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium w-12"></th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Job</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {crew.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {m.image ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted">
                          <Image src={m.image} alt={m.name} fill className="object-cover" sizes="32px" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          {m.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{m.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.job}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { startEdit(m); setShowAdd(false); }}>Edit</Button>
                        <Button size="sm" variant="destructive" disabled={pending} onClick={() => handleDelete(m.id)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editingId !== null && (
            <EditPanel
              state={editState}
              onChange={(u) => setEditState((s) => ({ ...s, ...u }))}
              onSave={() => saveEdit(editingId)}
              onCancel={() => setEditingId(null)}
              pending={pending}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No crew members.</p>
      )}

      {showAdd ? (
        <EditPanel
          state={addState}
          onChange={(u) => setAddState((s) => ({ ...s, ...u }))}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setAddState(empty()); }}
          pending={pending}
        />
      ) : (
        <Button variant="outline" onClick={() => { setShowAdd(true); setEditingId(null); }}>
          Add Crew Member
        </Button>
      )}
    </div>
  );
}
