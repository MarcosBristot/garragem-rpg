import Link from "next/link";

// Marca própria (nome provisório). Nada de logotipos de terceiros.
export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-[0.25em] uppercase"
    >
      <span
        aria-hidden="true"
        className="inline-block size-2.5 rotate-45 bg-destaque"
      />
      Garagem RPG
    </Link>
  );
}
