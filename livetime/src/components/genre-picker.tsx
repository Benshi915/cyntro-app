"use client";
import { useState } from "react";
import { GENRES } from "@/lib/constants";
import { Chip } from "./ui";

export function GenrePicker({ initial = [], max = 5, name = "genres" }: { initial?: string[]; max?: number; name?: string }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= max ? s : [...s, id]));
  return (
    <div className="flex flex-wrap gap-2">
      {GENRES.map((g) => (
        <button type="button" key={g.id} onClick={() => toggle(g.id)}>
          <Chip active={selected.includes(g.id)}>{g.label}</Chip>
        </button>
      ))}
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
