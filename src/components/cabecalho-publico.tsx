import Link from "next/link";
import { Marca } from "@/components/marca";

/** Cabeçalho das páginas públicas (perfil e carro). Estático. */
export function CabecalhoPublico() {
  return (
    <header className="border-b border-borda">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4">
        <Marca />
        <Link
          href="/entrar"
          className="inline-flex min-h-11 items-center rounded-full bg-destaque px-5 text-sm font-semibold text-fundo hover:bg-destaque/90"
        >
          Criar minha garagem
        </Link>
      </div>
    </header>
  );
}
