import Link from "next/link";
import { Marca } from "@/components/marca";
import { dadosPendentes } from "@/lib/empresa";

export default function LayoutLegal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-borda">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4">
          <Marca />
          <nav aria-label="Documentos">
            <ul className="flex flex-wrap gap-1 text-sm">
              {[
                ["/privacidade", "Privacidade"],
                ["/termos", "Termos"],
                ["/reembolso", "Reembolso"],
                ["/cookies", "Cookies"],
              ].map(([href, rotulo]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center px-2 text-texto-secundario hover:text-texto"
                  >
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl flex-1 px-4 py-12"
      >
        {dadosPendentes() ? (
          <p
            role="note"
            className="mb-8 rounded-2xl border border-destaque/60 bg-destaque/10 p-4 text-sm"
          >
            <strong>Rascunho.</strong> Faltam dados da empresa (marcados com
            [preencher]). Este documento ainda não vale para uso público e
            precisa de revisão jurídica antes da publicação.
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
