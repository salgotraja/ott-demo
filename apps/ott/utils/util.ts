
export function certColor(cert: string | null, _country: string): string {
    if (!cert) return "bg-zinc-700 text-zinc-300";
    const c = cert.toUpperCase().replace(/\s/g, "");
    if (["U", "G", "L", "ALL", "FSK0", "0", "TOUSPUBLICS"].includes(c)) return "bg-green-700 text-white";
    if (["UA", "PG", "PG-13", "12", "12A", "14", "14A", "15", "16", "M", "PG12", "FSK12+", "FSK16+", "10"].includes(c)) return "bg-amber-600 text-white";
    if (["A", "R", "NC-17", "18", "18+", "18A", "R18+", "X18+", "MA15+", "R15+", "19", "RESTRICTED", "FSK18+"].includes(c)) return "bg-red-700 text-white";
    return "bg-zinc-600 text-zinc-200";
}

export const CERT_LABELS: Record<string, Record<string, string>> = {
    IN: { U: "U — Universal", UA: "U/A — 12+", A: "A — Adults 18+" },
    US: { G: "G", PG: "PG", "PG-13": "PG-13 — 13+", R: "R — 17+", "NC-17": "NC-17 — 18+" },
    GB: { U: "U", PG: "PG", "12A": "12A", "12": "12", "15": "15+", "18": "18+" },
    AU: { G: "G", PG: "PG", M: "M — Mature", "MA 15+": "MA 15+", "R 18+": "R 18+", "X 18+": "X 18+" },
    CA: { G: "G", PG: "PG", "14A": "14A — 14+", "18A": "18A", R: "R", "A": "A — Adults" },
    DE: { "0": "FSK 0", "6": "FSK 6+", "12": "FSK 12+", "16": "FSK 16+", "18": "FSK 18+" },
    FR: { U: "Tous publics", "10": "10+", "12": "12+", "16": "16+", "18": "18+" },
    JP: { G: "G", PG12: "PG12 — 12+", "R15+": "R15+", "R18+": "R18+" },
    KR: { ALL: "All", "12": "12+", "15": "15+", "19": "19+", "RESTRICTED": "Restricted" },
    BR: { L: "L — Livre", "10": "10+", "12": "12+", "14": "14+", "16": "16+", "18": "18+" },
};

/** Returns the full human-readable cert label for a given cert code and country.
 *  Falls back to the raw cert code if no mapping exists. Returns null if cert is null. */
export function getCertLabel(cert: string | null, country: string): string | null {
    if (!cert) return null;
    return CERT_LABELS[country]?.[cert] ?? cert;
}

/** Formats runtime in minutes to "Xh Ym" string. */
export function formatRuntime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}