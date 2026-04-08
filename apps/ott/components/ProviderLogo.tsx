import Image from "next/image";

interface ProviderLogoProps {
  name: string;
  logoPath: string | null;
  size?: "sm" | "md" | "lg";
}

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w92";

const sizeMap = {
  sm: { container: "h-12 w-12", image: 48 },
  md: { container: "h-20 w-20", image: 80 },
  lg: { container: "h-24 w-24", image: 96 },
};

export function ProviderLogo({ name, logoPath, size = "md" }: ProviderLogoProps) {
  const { container, image } = sizeMap[size];
  const logoUrl = logoPath ? `${TMDB_IMAGE_BASE_URL}${logoPath}` : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${container} relative overflow-hidden rounded-lg bg-zinc-900`}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={image}
            height={image}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            No Logo
          </div>
        )}
      </div>
      <p className="text-center text-xs text-zinc-400">{name}</p>
    </div>
  );
}
