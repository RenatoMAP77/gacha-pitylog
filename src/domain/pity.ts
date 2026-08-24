import type { PullLogComContexto } from './types';

export interface StatusPity {
  pityAtual: number;
  softPityRef: number;
  hardPity: number;
  faltaSoft: number;
  faltaHard: number;
  naZonaSoftPity: boolean;
}

/**
 * Ordena por `data` (string ISO 8601, comparável lexicograficamente).
 * A UI grava timestamps com milissegundos, então colisões só ocorreriam
 * se dois registros fossem inseridos no mesmo instante — não é um caso
 * que o formulário permite.
 */
function ordenarPorData(logs: PullLogComContexto[]): PullLogComContexto[] {
  return [...logs].sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * Pity atual = soma de qtd_tiros de todos os registros não deletados,
 * do mesmo tipo de banner e mesma conta, desde o último 5★ (exclusive).
 * Carrega entre banners diferentes do mesmo tipo; não carrega entre
 * tipos ou contas diferentes.
 */
export function calcularPityAtual(
  logs: PullLogComContexto[],
  accountId: string,
  bannerTypeId: string
): number {
  const relevantes = logs.filter(
    (l) => l.accountId === accountId && l.bannerTypeId === bannerTypeId && l.deletedAt === null
  );
  const ordenados = ordenarPorData(relevantes);

  let ultimo5EstrelaIndex = -1;
  ordenados.forEach((l, i) => {
    if (l.veio5Estrela) ultimo5EstrelaIndex = i;
  });

  const posteriores = ordenados.slice(ultimo5EstrelaIndex + 1);
  return posteriores.reduce((sum, l) => sum + l.qtdTiros, 0);
}

export function calcularStatusPity(
  logs: PullLogComContexto[],
  accountId: string,
  bannerTypeId: string,
  hardPity: number,
  softPityRef: number
): StatusPity {
  const pityAtual = calcularPityAtual(logs, accountId, bannerTypeId);
  return {
    pityAtual,
    softPityRef,
    hardPity,
    faltaSoft: Math.max(0, softPityRef - pityAtual),
    faltaHard: Math.max(0, hardPity - pityAtual),
    naZonaSoftPity: pityAtual >= softPityRef && pityAtual < hardPity,
  };
}

/**
 * Ajuste manual (§5): dado o pity que o app calcula hoje e o pity real
 * conferido no jogo, devolve o qtd_tiros (pode ser negativo) a gravar
 * num pull_log com tipo_registro = 'ajuste'.
 */
export function calcularDeltaAjuste(pityCalculadoHoje: number, pityRealNoJogo: number): number {
  return pityRealNoJogo - pityCalculadoHoje;
}
