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

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: "primario" | "secundario" }) {
  const estilo =
    variante === "primario"
      ? "bg-destaque text-fundo hover:bg-destaque/90"
      : "border border-borda text-texto hover:bg-borda/50";
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
