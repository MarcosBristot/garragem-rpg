import Link from "next/link";
import { LogoHorizontal } from "@/components/logo";

// Marca LifeInGears: o logo (traçado do original) na cor de destaque.
export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="LifeInGears, página inicial"
      className="inline-flex min-h-11 items-center text-destaque"
    >
      <LogoHorizontal className="h-5 w-auto sm:h-6" />
    </Link>
  );
}
