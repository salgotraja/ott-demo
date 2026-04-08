"use client";

interface CountryFilterProps {
  selectedLanguage: string;
  selectedCountry: string;
  onlyWithProviders: boolean;
  onLanguageChange: (language: string) => void;
  onCountryChange: (country: string) => void;
  onProviderFilterChange: (onlyWithProviders: boolean) => void;
}

const LANGUAGES = [
  { code: "ALL", name: "All Languages" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "en", name: "English" },
];

const COUNTRIES = [
  { code: "ALL", name: "All Countries" },
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
];

export function CountryFilter({
  selectedLanguage,
  selectedCountry,
  onlyWithProviders,
  onLanguageChange,
  onCountryChange,
  onProviderFilterChange
}: CountryFilterProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-zinc-900 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <label htmlFor="language" className="text-sm font-semibold text-white whitespace-nowrap">
            Language:
          </label>
          <select
            id="language"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="country" className="text-sm font-semibold text-white whitespace-nowrap">
            Country:
          </label>
          <select
            id="country"
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={onlyWithProviders}
          onChange={(e) => onProviderFilterChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm text-zinc-300">
          Only show movies with streaming providers in India
        </span>
      </label>
    </div>
  );
}
