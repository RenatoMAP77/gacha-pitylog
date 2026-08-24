import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CorrigirPityModal } from '@/components/CorrigirPityModal';
import { NovoBannerModal } from '@/components/NovoBannerModal';
import { PityCard } from '@/components/PityCard';
import { RegistrarCincoEstrelasModal } from '@/components/RegistrarCincoEstrelasModal';
import { db } from '@/db/client';
import { ativarBanner, criarBannerEAtivar, listarBannersDoTipo } from '@/services/banners';
import { listarContas } from '@/services/accounts';
import { type CardDashboard, getDashboardData } from '@/services/dashboard';
import { getOuCriarCharacter, registrarAjuste, registrarPull } from '@/services/pullLogs';
import { useAccountStore } from '@/store/accountStore';

export default function Dashboard() {
  const router = useRouter();
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const setActiveAccountId = useAccountStore((s) => s.setActiveAccountId);

  const [cards, setCards] = useState<CardDashboard[]>([]);
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([]);
  const [novoBannerTipo, setNovoBannerTipo] = useState<CardDashboard | null>(null);
  const [corrigirPityTipo, setCorrigirPityTipo] = useState<CardDashboard | null>(null);
  const [veio5EstrelaCard, setVeio5EstrelaCard] = useState<CardDashboard | null>(null);

  const carregar = useCallback(async () => {
    if (!activeAccountId) return;
    const [dashboardData, listaContas] = await Promise.all([getDashboardData(db, activeAccountId), listarContas(db)]);
    setCards(dashboardData);
    setContas(listaContas);
  }, [activeAccountId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function adicionarTiros(card: CardDashboard, qtd: number) {
    if (!activeAccountId || !card.bannerAtivo) return;
    await registrarPull(db, { accountId: activeAccountId, bannerId: card.bannerAtivo.id, qtdTiros: qtd });
    carregar();
  }

  function abrirMenuLongo(card: CardDashboard) {
    if (!card.bannerAtivo) return;
    Alert.alert(card.bannerTypeNome, card.bannerAtivo.apelido ?? card.bannerAtivo.nome, [
      { text: 'Corrigir pity', onPress: () => setCorrigirPityTipo(card) },
      { text: 'Trocar banner', onPress: () => trocarBanner(card) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function trocarBanner(card: CardDashboard) {
    const existentes = await listarBannersDoTipo(db, card.bannerTypeId);
    const opcoes = existentes
      .filter((b) => b.id !== card.bannerAtivo?.id)
      .map((b) => ({ text: b.apelido ?? b.nome, onPress: () => selecionarBanner(card, b.id) }));

    Alert.alert('Trocar banner ativo', undefined, [
      ...opcoes,
      { text: '+ Novo banner', onPress: () => setNovoBannerTipo(card) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function selecionarBanner(card: CardDashboard, bannerId: string) {
    await ativarBanner(db, bannerId, card.bannerTypeId);
    carregar();
  }

  async function criarBanner(nome: string, apelido: string) {
    if (!novoBannerTipo) return;
    await criarBannerEAtivar(db, {
      bannerTypeId: novoBannerTipo.bannerTypeId,
      nome,
      apelido: apelido || null,
    });
    setNovoBannerTipo(null);
    carregar();
  }

  async function confirmarAjuste(pityReal: number) {
    if (!activeAccountId || !corrigirPityTipo?.bannerAtivo) return;
    await registrarAjuste(db, {
      accountId: activeAccountId,
      bannerTypeId: corrigirPityTipo.bannerTypeId,
      bannerId: corrigirPityTipo.bannerAtivo.id,
      pityReal,
    });
    setCorrigirPityTipo(null);
    carregar();
  }

  async function confirmarVeio5Estrela(params: {
    qtdTiros: number;
    personagem: { id: string | null; nome: string };
    perdeu5050: boolean | null;
  }) {
    if (!activeAccountId || !veio5EstrelaCard?.bannerAtivo) return;

    const characterId =
      params.personagem.id ??
      (await getOuCriarCharacter(db, {
        gameId: veio5EstrelaCard.gameId,
        nome: params.personagem.nome,
        tipoItem: veio5EstrelaCard.tipo === 'weapon' ? 'weapon' : 'character',
      }));

    await registrarPull(db, {
      accountId: activeAccountId,
      bannerId: veio5EstrelaCard.bannerAtivo.id,
      qtdTiros: params.qtdTiros,
      veio5Estrela: true,
      characterId,
      perdeu5050: params.perdeu5050,
    });
    setVeio5EstrelaCard(null);
    carregar();
  }

  const jogos = Array.from(new Set(cards.map((c) => c.gameId))).map((gameId) => ({
    gameId,
    gameNome: cards.find((c) => c.gameId === gameId)!.gameNome,
    cards: cards.filter((c) => c.gameId === gameId),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contaSeletor}>
          {contas.map((conta) => (
            <Pressable
              key={conta.id}
              style={[styles.contaChip, conta.id === activeAccountId && styles.contaChipAtiva]}
              onPress={() => setActiveAccountId(conta.id)}
            >
              <Text style={[styles.contaChipTexto, conta.id === activeAccountId && styles.contaChipTextoAtiva]}>
                {conta.nome}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.headerBotoes}>
          <Pressable onPress={() => router.push('/historico')}>
            <Text style={styles.headerLink}>Histórico</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/config')}>
            <Text style={styles.headerLink}>Config</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {jogos.map((jogo) => (
          <View key={jogo.gameId} style={styles.grupoJogo}>
            <Text style={styles.tituloJogo}>{jogo.gameNome.toUpperCase()}</Text>
            {jogo.cards.map((card) => (
              <PityCard
                key={card.bannerTypeId}
                card={card}
                onAdicionarTiros={(qtd) => adicionarTiros(card, qtd)}
                onVeio5Estrela={() => setVeio5EstrelaCard(card)}
                onLongPress={() => abrirMenuLongo(card)}
                onNovoBanner={() => setNovoBannerTipo(card)}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/registrar')}>
        <Text style={styles.fabTexto}>+</Text>
      </Pressable>

      <NovoBannerModal
        visible={novoBannerTipo !== null}
        bannerTypeNome={novoBannerTipo?.bannerTypeNome ?? ''}
        onConfirmar={criarBanner}
        onCancelar={() => setNovoBannerTipo(null)}
      />

      <CorrigirPityModal
        visible={corrigirPityTipo !== null}
        bannerTypeNome={corrigirPityTipo?.bannerTypeNome ?? ''}
        pityAtual={corrigirPityTipo?.status.pityAtual ?? 0}
        onConfirmar={confirmarAjuste}
        onCancelar={() => setCorrigirPityTipo(null)}
      />

      <RegistrarCincoEstrelasModal
        visible={veio5EstrelaCard !== null}
        card={veio5EstrelaCard}
        onConfirmar={confirmarVeio5Estrela}
        onCancelar={() => setVeio5EstrelaCard(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  contaSeletor: { gap: 8 },
  contaChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#e0e0e0' },
  contaChipAtiva: { backgroundColor: '#3f51b5' },
  contaChipTexto: { fontSize: 13, color: '#444', fontWeight: '600' },
  contaChipTextoAtiva: { color: '#fff' },
  headerBotoes: { flexDirection: 'row', gap: 14 },
  headerLink: { color: '#3f51b5', fontWeight: '600', fontSize: 13 },
  lista: { padding: 16, paddingBottom: 100 },
  grupoJogo: { marginBottom: 20 },
  tituloJogo: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, letterSpacing: 0.5 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3f51b5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabTexto: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '400' },
});
