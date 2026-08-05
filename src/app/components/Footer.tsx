import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-800 py-6 text-xs text-slate-500 sm:flex-row">
      <p>© 2026 MaicaTrades. Educational purposes only.</p>

      <div className="flex gap-4">
        <Link
          href="/disclaimer"
          className="transition hover:text-slate-300"
        >
          Disclaimer
        </Link>

        <Link
          href="/privacy"
          className="transition hover:text-slate-300"
        >
          Privacy
        </Link>

        <Link
          href="/terms"
          className="transition hover:text-slate-300"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}