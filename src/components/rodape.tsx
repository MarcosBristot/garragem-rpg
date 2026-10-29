import Link from "next/link";
import { EMPRESA } from "@/lib/empresa";

// Identificação do fornecedor (CDC e Decreto 7.962/2013) e links legais.
export function Rodape() {
  return (
    <footer className="border-t border-borda px-4 pt-10 pb-24 text-sm text-texto-secundario sm:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-semibold tracking-[0.25em] text-texto uppercase">
            Garagem RPG
          </p>
          <p>
            {EMPRESA.nome} · CNPJ {EMPRESA.cnpj}
          </p>
          <p>
            {EMPRESA.cidade} · {EMPRESA.email}
          </p>
          {/* Ano fixo: ler a data aqui quebraria a página estática. */}
          <p className="text-texto-apagado">© 2026 Garagem RPG</p>
        </div>
        <nav aria-label="Documentos legais">
          <ul className="grid grid-cols-2 gap-x-6">
            {[
              ["/privacidade", "Privacidade"],
              ["/termos", "Termos de Serviço"],
              ["/reembolso", "Reembolso"],
              ["/cookies", "Cookies"],
            ].map(([href, rotulo]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center hover:text-texto"
                >
                  {rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
