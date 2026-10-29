import { CATEGORIAS, ESPACOS, totalCentavos } from "@/dominio/item";
import { formatarReais } from "@/dominio/dinheiro";
import { removerItem } from "./acoes";

type Item = {
  id: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  valor_centavos: number | null;
  espaco: keyof typeof ESPACOS | null;
};

export function ListaItens({
  carroId,
  registroId,
  itens,
}: {
  carroId: string;
  registroId: string;
  itens: Item[];
}) {
  if (itens.length === 0) {
    return (
      <p className="text-sm text-texto-secundario">
        Nenhum item ainda. Adicione peças, fluidos ou mão de obra.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda">
        {itens.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.descricao}</p>
              <p className="text-sm text-texto-secundario">
                {CATEGORIAS[item.categoria as keyof typeof CATEGORIAS] ??
                  item.categoria}
                {" · "}
                {item.quantidade.toLocaleString("pt-BR")}×
                {item.espaco ? ` · ${ESPACOS[item.espaco]}` : null}
                {item.valor_centavos !== null
                  ? ` · ${formatarReais(item.valor_centavos)}`
                  : null}
              </p>
            </div>
            <form action={removerItem.bind(null, carroId, registroId, item.id)}>
              <button
                type="submit"
                aria-label={`Remover ${item.descricao}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-sm text-red-300 hover:bg-red-400/10 focus-visible:outline-2 focus-visible:outline-destaque"
              >
                Remover
              </button>
            </form>
          </li>
        ))}
      </ul>
      <p className="self-end text-sm">
        Total informado: <strong>{formatarReais(totalCentavos(itens))}</strong>
      </p>
    </div>
  );
}
