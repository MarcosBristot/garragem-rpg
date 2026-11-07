import { describe, expect, it } from "vitest";
import { agrupar, frase, quem, type Notificacao } from "./notificacoes";

const n = (
  tipo: Notificacao["tipo"],
  ator: string,
  hora: number,
  post: string | null = null,
  trecho: string | null = null,
): Notificacao => ({
  tipo,
  ator_id: ator,
  post_id: post,
  trecho,
  criado_em: `2026-11-07T${String(hora).padStart(2, "0")}:00:00Z`,
});

describe("agrupar notificações", () => {
  it("junta curtidas do mesmo post e seguidores; comentários ficam sozinhos", () => {
    const grupos = agrupar(
      [
        n("curtida", "ana", 10, "p1"),
        n("curtida", "beto", 11, "p1"),
        n("curtida", "caio", 9, "p2"),
        n("comentario", "ana", 12, "p1", "Lindo!"),
        n("comentario", "beto", 8, "p1", "Top"),
        n("seguidor", "duda", 7),
        n("seguidor", "eva", 6),
      ],
      null,
    );
    expect(grupos.map((g) => [g.tipo, g.atores])).toEqual([
      ["comentario", ["ana"]],
      ["curtida", ["beto", "ana"]],
      ["curtida", ["caio"]],
      ["comentario", ["beto"]],
      ["seguidor", ["duda", "eva"]],
    ]);
  });

  it("marca como novo o que chegou depois da última visita", () => {
    const grupos = agrupar(
      [n("curtida", "ana", 10, "p1"), n("seguidor", "beto", 5)],
      "2026-11-07T08:00:00Z",
    );
    expect(grupos.map((g) => g.novo)).toEqual([true, false]);
  });

  it("a mesma pessoa não aparece duas vezes no grupo", () => {
    const [g] = agrupar(
      [n("curtida", "ana", 10, "p1"), n("curtida", "ana", 9, "p1")],
      null,
    );
    expect(g.atores).toEqual(["ana"]);
  });
});

describe("frases", () => {
  it("monta quem fez em português", () => {
    expect(quem(["Ana"])).toBe("Ana");
    expect(quem(["Ana", "Beto"])).toBe("Ana e Beto");
    expect(quem(["Ana", "Beto", "Caio"])).toBe("Ana e mais 2 pessoas");
  });

  it("concorda singular e plural", () => {
    const [um] = agrupar([n("curtida", "a", 1, "p")], null);
    expect(frase(um, ["Ana"])).toBe("Ana curtiu seu post");
    const [varios] = agrupar(
      [n("seguidor", "a", 1), n("seguidor", "b", 2)],
      null,
    );
    expect(frase(varios, ["Beto", "Ana"])).toBe(
      "Beto e Ana começaram a seguir você",
    );
    const [c] = agrupar([n("comentario", "a", 1, "p", "Show")], null);
    expect(frase(c, ["Ana"])).toBe("Ana comentou: “Show”");
  });
});
