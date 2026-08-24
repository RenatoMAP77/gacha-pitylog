import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CardDashboard } from '@/services/dashboard';

import { CharacterAvatar } from './CharacterAvatar';
import { ProgressBar } from './ProgressBar';

interface Props {
  card: CardDashboard;
  onAdicionarTiros: (qtd: number) => void;
  onVeio5Estrela: () => void;
  onLongPress: () => void;
  onNovoBanner: () => void;
}

export function PityCard({ card, onAdicionarTiros, onVeio5Estrela, onLongPress, onNovoBanner }: Props) {
  const { status } = card;
  const destaque = card.tipo === 'standard';

  if (!card.bannerAtivo) {
    return (
      <Pressable style={[styles.card, destaque && styles.cardDestaque]} onPress={onNovoBanner}>
        <Text style={styles.tipoNome}>{card.bannerTypeNome}</Text>
        <Text style={styles.semBanner}>Nenhum banner ativo — toque para criar</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.card, destaque && styles.cardDestaque]} onLongPress={onLongPress} delayLongPress={350}>
      <View style={styles.headerRow}>
        <Text style={styles.tipoNome}>
          {card.bannerTypeNome} · {card.bannerAtivo.apelido ?? card.bannerAtivo.nome}
        </Text>
        {destaque && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>sempre ativo</Text>
          </View>
        )}
      </View>

      {card.rosterFotos.length > 0 && (
        <View style={styles.rosterRow}>
          {card.rosterFotos.map((p) => (
            <CharacterAvatar key={p.id} nome={p.nome} imageUrl={p.imageUrl} size={32} />
          ))}
        </View>
      )}

      <ProgressBar pityAtual={status.pityAtual} softPityRef={status.softPityRef} hardPity={status.hardPity} />
      <Text style={styles.contador}>
        {status.pityAtual} / {status.hardPity}
      </Text>
      <Text style={status.naZonaSoftPity ? styles.zonaSoft : styles.faltaTexto}>
        {status.naZonaSoftPity
          ? 'na zona de soft pity 🔥'
          : `${status.faltaSoft} para soft pity · ${status.faltaHard} p/ hard`}
      </Text>
      <View style={styles.botoes}>
        <Pressable style={styles.botaoDestaqueOuro} onPress={onVeio5Estrela}>
          <Text style={styles.botaoDestaqueOuroTexto}>5★!</Text>
        </Pressable>
        <View style={styles.botoesDireita}>
          <Pressable style={styles.botao} onPress={() => onAdicionarTiros(1)}>
            <Text style={styles.botaoTexto}>+1</Text>
          </Pressable>
          <Pressable style={styles.botao} onPress={() => onAdicionarTiros(10)}>
            <Text style={styles.botaoTexto}>+10</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardDestaque: {
    borderWidth: 1.5,
    borderColor: '#c5cae9',
    backgroundColor: '#fbfbff',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tipoNome: { fontSize: 15, fontWeight: '700', color: '#222', flexShrink: 1 },
  badge: { backgroundColor: '#3f51b5', borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  badgeTexto: { color: '#fff', fontSize: 10, fontWeight: '700' },
  rosterRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  contador: { fontSize: 13, color: '#555' },
  faltaTexto: { fontSize: 12, color: '#777' },
  zonaSoft: { fontSize: 12, color: '#e67e22', fontWeight: '600' },
  semBanner: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  botoes: { flexDirection: 'row', gap: 10, marginTop: 4, justifyContent: 'space-between', alignItems: 'center' },
  botoesDireita: { flexDirection: 'row', gap: 10 },
  botao: {
    backgroundColor: '#3f51b5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  botaoTexto: { color: '#fff', fontWeight: '700' },
  botaoDestaqueOuro: {
    backgroundColor: '#fdf3e0',
    borderWidth: 1,
    borderColor: '#e67e22',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  botaoDestaqueOuroTexto: { color: '#e67e22', fontWeight: '800' },
});
