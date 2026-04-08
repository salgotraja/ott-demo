interface StarRatingProps {
  rating: number | null;
  voteCount?: number | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { star: "h-4 w-4", text: "text-sm" },
  md: { star: "h-5 w-5", text: "text-base" },
  lg: { star: "h-6 w-6", text: "text-lg" },
};

export function StarRating({ rating, voteCount, size = "md" }: StarRatingProps) {
  if (rating === null) return null;

  const { star, text } = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <svg className={`${star} fill-yellow-400`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className={`${text} font-semibold text-white`}>{rating.toFixed(1)}</span>
      </div>
      {voteCount !== null && voteCount !== undefined && (
        <span className={`${text} text-zinc-400`}>({voteCount.toLocaleString()})</span>
      )}
    </div>
  );
}
