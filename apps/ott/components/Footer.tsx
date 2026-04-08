import Link from "next/link";

const Footer = () => {
    return (
        <footer className="mt-16 border-t border-zinc-800 bg-zinc-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <p className="text-sm text-zinc-400">
                    This product uses the TMDB API but is not endorsed or certified by TMDB.
                    Provider data sourced from JustWatch.
                </p>
                <Link
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                    The Movie Database
                </Link>
            </div>
        </footer>
    );
};

export default Footer;