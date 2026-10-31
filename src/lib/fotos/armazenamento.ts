import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { arquivoDaChave } from "./chaves";
import { TAMANHOS, type Tamanho } from "./processar";

// Armazenamento de fotos via protocolo S3: Cloudflare R2 em produção e o
// S3 do Supabase local em desenvolvimento. Só muda o .env. O bucket é
// PRIVADO: toda foto é servida por URL assinada e temporária.

function variavel(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida.`);
  return valor;
}

let cliente: S3Client | undefined;

function s3(): S3Client {
  cliente ??= new S3Client({
    endpoint: variavel("ARMAZENAMENTO_ENDPOINT"),
    // O R2 ignora a região, mas o SDK exige; a doc da Cloudflare usa "auto".
    region: process.env.ARMAZENAMENTO_REGIAO ?? "auto",
    credentials: {
      accessKeyId: variavel("ARMAZENAMENTO_CHAVE_ID"),
      secretAccessKey: variavel("ARMAZENAMENTO_CHAVE_SECRETA"),
    },
    // Supabase local precisa de URL no formato /bucket/chave.
    forcePathStyle: process.env.ARMAZENAMENTO_PATH_STYLE === "true",
    // Versões novas do SDK mandam checksums que o R2 recusa (doc do R2).
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cliente;
}

const bucket = () => variavel("ARMAZENAMENTO_BUCKET");

/** Envia os três tamanhos de uma foto já processada (sem EXIF). */
export async function enviarFoto(
  chave: string,
  arquivos: Record<Tamanho, Buffer>,
): Promise<void> {
  await Promise.all(
    (Object.keys(TAMANHOS) as Tamanho[]).map((tamanho) =>
      s3().send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: arquivoDaChave(chave, tamanho),
          Body: arquivos[tamanho],
          ContentType: "image/webp",
          CacheControl: "private, max-age=31536000, immutable",
        }),
      ),
    ),
  );
}

/** URL temporária (1 h) para exibir uma foto a quem tem permissão. */
export async function urlDaFoto(
  chave: string,
  tamanho: Tamanho,
  segundos = 3600,
): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: arquivoDaChave(chave, tamanho),
    }),
    { expiresIn: segundos },
  );
}

/** URLs dos três tamanhos (para srcset). */
export async function urlsDaFoto(chave: string) {
  const [mini, feed, cheia] = await Promise.all([
    urlDaFoto(chave, "mini"),
    urlDaFoto(chave, "feed"),
    urlDaFoto(chave, "cheia"),
  ]);
  return { mini, feed, cheia };
}

/** Apaga todos os arquivos sob um prefixo (carro, registro ou conta). */
export async function apagarPrefixo(prefixo: string): Promise<void> {
  if (!prefixo.startsWith("u/") || !prefixo.endsWith("/")) {
    throw new Error("Prefixo inseguro para exclusão.");
  }
  let continuacao: string | undefined;
  do {
    const lista = await s3().send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: prefixo,
        ContinuationToken: continuacao,
      }),
    );
    const chaves = (lista.Contents ?? []).flatMap((o) =>
      o.Key ? [{ Key: o.Key }] : [],
    );
    if (chaves.length > 0) {
      await s3().send(
        new DeleteObjectsCommand({
          Bucket: bucket(),
          Delete: { Objects: chaves, Quiet: true },
        }),
      );
    }
    continuacao = lista.IsTruncated ? lista.NextContinuationToken : undefined;
  } while (continuacao);
}

/** Apaga os três arquivos de uma foto. */
export async function apagarFoto(chave: string): Promise<void> {
  await s3().send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: {
        Objects: (Object.keys(TAMANHOS) as Tamanho[]).map((t) => ({
          Key: arquivoDaChave(chave, t),
        })),
        Quiet: true,
      },
    }),
  );
}

/** Baixa um tamanho da foto (uso interno do servidor, ex.: gerar imagens). */
export async function baixarFoto(
  chave: string,
  tamanho: Tamanho,
): Promise<Buffer> {
  const resposta = await s3().send(
    new GetObjectCommand({
      Bucket: bucket(),
      Key: arquivoDaChave(chave, tamanho),
    }),
  );
  if (!resposta.Body) throw new Error("Foto vazia.");
  return Buffer.from(await resposta.Body.transformToByteArray());
}
