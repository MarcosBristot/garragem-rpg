import type { ComponentProps } from "react";

// Peças de formulário acessíveis: rótulo ligado ao campo, erro anunciado
// por leitores de tela e alvos de toque de 44 px.

export function Campo({
  rotulo,
  erro,
  dica,
  id,
  ...input
}: ComponentProps<"input"> & {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
}) {
  const idDescricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={idDescricao}
        className="min-h-11 rounded-lg border border-borda bg-fundo px-3 text-base outline-none focus-visible:border-destaque focus-visible:ring-2 focus-visible:ring-destaque/40 aria-invalid:border-red-400"
        {...input}
      />
      {erro ? (
        <p id={`${id}-erro`} className="text-sm text-red-300">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="text-sm text-texto-secundario">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

export function CaixaMarcacao({
  rotulo,
  dica,
  id,
  ...input
}: Omit<ComponentProps<"input">, "type"> & {
  id: string;
  rotulo: string;
  dica?: string;
}) {
  // O <label> inteiro é clicável: alvo de toque bem maior que a caixinha.
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-borda p-3 has-focus-visible:border-destaque"
    >
      <input
        id={id}
        type="checkbox"
        // Nome = só o rótulo; a dica vira descrição (sem repetir na leitura).
        aria-labelledby={`${id}-rotulo`}
        aria-describedby={dica ? `${id}-dica` : undefined}
        className="mt-0.5 size-5 shrink-0 accent-destaque"
        {...input}
      />
      <span className="flex flex-col gap-0.5">
        <span id={`${id}-rotulo`} className="text-sm font-medium">
          {rotulo}
        </span>
        {dica ? (
          <span id={`${id}-dica`} className="text-sm text-texto-secundario">
            {dica}
          </span>
        ) : null}
      </span>
    </label>
  );
}

const ESTILOS_BOTAO = {
  primario: "bg-destaque text-fundo hover:bg-destaque/90",
  secundario: "border border-borda text-texto hover:bg-borda/50",
  perigo: "border border-red-400/60 text-red-300 hover:bg-red-400/10",
};

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof ESTILOS_BOTAO }) {
  const estilo = ESTILOS_BOTAO[variante];
  return (
    <button
      className={`min-h-11 rounded-lg px-4 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque disabled:opacity-60 ${estilo} ${className}`}
      {...props}
    />
  );
}

export function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-borda bg-superficie p-6">
        {children}
      </div>
    </main>
  );
}
