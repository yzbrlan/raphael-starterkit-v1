import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
        <span className="text-lg font-bold text-primary">🇨🇳</span>
      </div>
      <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        ChineseName.club
      </span>
    </Link>
  );
}
