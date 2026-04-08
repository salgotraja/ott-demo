interface GenreTagProps {
  name: string;
}

export function GenreTag({ name }: GenreTagProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200">
      {name}
    </span>
  );
}
