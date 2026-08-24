import { calcularDeltaAjuste, calcularPityAtual, calcularStatusPity } from './pity';
import type { PullLogComContexto } from './types';

const ACC = 'acc-principal';
const ACC_SMURF = 'acc-smurf';
const TIPO_PERSONAGEM = 'type-personagem';
const TIPO_ARMA = 'type-arma';

let seq = 0;
function log(overrides: Partial<PullLogComContexto>): PullLogComContexto {
  seq += 1;
  return {
    id: `log-${seq}`,
    accountId: ACC,
    bannerTypeId: TIPO_PERSONAGEM,
    data: `2026-01-${String(seq).padStart(2, '0')}T00:00:00.000Z`,
    tipoRegistro: 'pull',
    qtdTiros: 10,
    veio5Estrela: false,
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  seq = 0;
});

describe('calcularPityAtual', () => {
  test('pity carrega entre dois banners do mesmo tipo sem 5★ no meio', () => {
    const logs = [
      log({ id: 'a', data: '2026-01-01T00:00:00.000Z', qtdTiros: 30 }), // banner 1
      log({ id: 'b', data: '2026-01-05T00:00:00.000Z', qtdTiros: 20 }), // banner 2, mesmo tipo
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(50);
  });

  test('pity não carrega entre tipos diferentes', () => {
    const logs = [
      log({ bannerTypeId: TIPO_ARMA, data: '2026-01-01T00:00:00.000Z', qtdTiros: 40 }),
      log({ bannerTypeId: TIPO_PERSONAGEM, data: '2026-01-02T00:00:00.000Z', qtdTiros: 10 }),
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(10);
  });

  test('pity não carrega entre contas diferentes', () => {
    const logs = [
      log({ accountId: ACC_SMURF, data: '2026-01-01T00:00:00.000Z', qtdTiros: 40 }),
      log({ accountId: ACC, data: '2026-01-02T00:00:00.000Z', qtdTiros: 10 }),
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(10);
  });

  test('dois 5★ no mesmo banner: conta a partir do último', () => {
    const logs = [
      log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 78, veio5Estrela: true }),
      log({ data: '2026-01-02T00:00:00.000Z', qtdTiros: 5 }),
      log({ data: '2026-01-03T00:00:00.000Z', qtdTiros: 60, veio5Estrela: true }),
      log({ data: '2026-01-04T00:00:00.000Z', qtdTiros: 7 }),
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(7);
  });

  test('deletar um registro recalcula corretamente', () => {
    const logs = [
      log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 78, veio5Estrela: true }),
      log({ data: '2026-01-02T00:00:00.000Z', qtdTiros: 5, deletedAt: '2026-01-10T00:00:00.000Z' }),
      log({ data: '2026-01-03T00:00:00.000Z', qtdTiros: 7 }),
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(7);
  });

  test('registro retroativo entra na posição certa da ordenação', () => {
    const logs = [
      log({ id: 'depois-5estrela', data: '2026-01-05T00:00:00.000Z', qtdTiros: 5 }),
      log({ id: 'cinco-estrela', data: '2026-01-03T00:00:00.000Z', qtdTiros: 78, veio5Estrela: true }),
      // inserido depois, mas com data anterior ao 5★ -> não deve contar
      log({ id: 'retroativo-antes', data: '2026-01-01T00:00:00.000Z', qtdTiros: 999 }),
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(5);
  });

  test('ajuste positivo eleva o pity para o valor informado', () => {
    const pityAntes = calcularPityAtual(
      [log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 45 })],
      ACC,
      TIPO_PERSONAGEM
    );
    const delta = calcularDeltaAjuste(pityAntes, 67);
    const logsComAjuste = [
      log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 45 }),
      log({ data: '2026-01-02T00:00:00.000Z', tipoRegistro: 'ajuste', qtdTiros: delta }),
    ];
    expect(calcularPityAtual(logsComAjuste, ACC, TIPO_PERSONAGEM)).toBe(67);
  });

  test('ajuste negativo reduz o pity para o valor informado', () => {
    const pityAntes = calcularPityAtual(
      [log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 45 })],
      ACC,
      TIPO_PERSONAGEM
    );
    const delta = calcularDeltaAjuste(pityAntes, 30);
    expect(delta).toBe(-15);
    const logsComAjuste = [
      log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 45 }),
      log({ data: '2026-01-02T00:00:00.000Z', tipoRegistro: 'ajuste', qtdTiros: delta }),
    ];
    expect(calcularPityAtual(logsComAjuste, ACC, TIPO_PERSONAGEM)).toBe(30);
  });

  test('ajuste anterior a um 5★ é ignorado no cálculo', () => {
    const logs = [
      log({ data: '2026-01-01T00:00:00.000Z', tipoRegistro: 'ajuste', qtdTiros: 999 }),
      log({ data: '2026-01-02T00:00:00.000Z', qtdTiros: 78, veio5Estrela: true }),
      log({ data: '2026-01-03T00:00:00.000Z', qtdTiros: 3 }),
    ];
    expect(calcularPityAtual(logs, ACC, TIPO_PERSONAGEM)).toBe(3);
  });
});

describe('calcularStatusPity', () => {
  test('sinaliza zona de soft pity e falta para hard pity', () => {
    const logs = [log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 76 })];
    const status = calcularStatusPity(logs, ACC, TIPO_PERSONAGEM, 90, 74);
    expect(status.pityAtual).toBe(76);
    expect(status.faltaSoft).toBe(0);
    expect(status.faltaHard).toBe(14);
    expect(status.naZonaSoftPity).toBe(true);
  });

  test('fora da zona de soft pity antes do limiar', () => {
    const logs = [log({ data: '2026-01-01T00:00:00.000Z', qtdTiros: 20 })];
    const status = calcularStatusPity(logs, ACC, TIPO_PERSONAGEM, 90, 74);
    expect(status.faltaSoft).toBe(54);
    expect(status.naZonaSoftPity).toBe(false);
  });
});
