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
        className={`min-h-11 px-3 ${ESTILO_ENTRADA}`}
        {...input}
      />
      <Mensagem id={id} erro={erro} dica={dica} />
    </div>
  );
}

const ESTILO_ENTRADA =
  "rounded-lg border border-borda-campo bg-fundo text-base outline-none focus-visible:border-destaque focus-visible:ring-2 focus-visible:ring-destaque/40 aria-invalid:border-red-400";

/** Erro tem prioridade sobre a dica; os ids batem com aria-describedby. */
function Mensagem({
  id,
  erro,
  dica,
}: {
  id: string;
  erro?: string;
  dica?: string;
}) {
  if (erro) {
    return (
      <p id={`${id}-erro`} className="text-sm text-red-300">
        {erro}
      </p>
    );
  }
  if (dica) {
    return (
      <p id={`${id}-dica`} className="text-sm text-texto-secundario">
        {dica}
      </p>
    );
  }
  return null;
}

export function Selecao({
  rotulo,
  erro,
  id,
  opcoes,
  vazio,
  ...select
}: ComponentProps<"select"> & {
  id: string;
  rotulo: string;
  erro?: string;
  opcoes: Record<string, string>;
  /** Texto da opção vazia, quando o campo é opcional. */
  vazio?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <select
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`min-h-11 px-3 ${ESTILO_ENTRADA}`}
        {...select}
      >
        {vazio !== undefined ? <option value="">{vazio}</option> : null}
        {Object.entries(opcoes).map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      <Mensagem id={id} erro={erro} />
    </div>
  );
}

export function AreaTexto({
  rotulo,
  erro,
  dica,
  id,
  ...textarea
}: ComponentProps<"textarea"> & {
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
      <textarea
        id={id}
        rows={4}
        aria-invalid={erro ? true : undefined}
        aria-describedby={idDescricao}
        className={`px-3 py-2 ${ESTILO_ENTRADA}`}
        {...textarea}
      />
      <Mensagem id={id} erro={erro} dica={dica} />
    </div>
  );
}

/** Grupo de rádio: <fieldset> + <legend> é o que o leitor de tela anuncia. */
export function GrupoOpcoes({
  legenda,
  name,
  opcoes,
  valor,
  erro,
}: {
  legenda: string;
  name: string;
  opcoes: { valor: string; rotulo: string; descricao?: string }[];
  valor: string;
  erro?: string;
}) {
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={erro ? `${name}-erro` : undefined}
    >
      <legend className="mb-1.5 text-sm font-medium">{legenda}</legend>
      {opcoes.map((opcao) => {
        const id = `${name}-${opcao.valor}`;
        return (
          <label
            key={opcao.valor}
            htmlFor={id}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-borda p-3 has-checked:border-destaque has-focus-visible:ring-2 has-focus-visible:ring-destaque/40"
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={opcao.valor}
              defaultChecked={valor === opcao.valor}
              aria-labelledby={`${id}-rotulo`}
              aria-describedby={opcao.descricao ? `${id}-descricao` : undefined}
              className="mt-0.5 size-5 shrink-0 accent-destaque"
            />
            <span className="flex flex-col gap-0.5">
              <span id={`${id}-rotulo`} className="text-sm font-medium">
                {opcao.rotulo}
              </span>
              {opcao.descricao ? (
                <span
                  id={`${id}-descricao`}
                  className="text-sm text-texto-secundario"
                >
                  {opcao.descricao}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
      <Mensagem id={name} erro={erro} />
    </fieldset>
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
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10"
    >
      <div className="rounded-xl border border-borda bg-superficie p-6">
        {children}
      </div>
    </main>
  );
}
