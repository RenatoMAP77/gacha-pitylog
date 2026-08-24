import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { atualizarSoftPityRef, criarBannerType, getBannerTypesComJogo, listarJogos } from '@/services/catalog';

type TipoBanner = Awaited<ReturnType<typeof getBannerTypesComJogo>>[number];
type Jogo = Awaited<ReturnType<typeof listarJogos>>[number];
type TipoEnum = 'character' | 'weapon' | 'standard';

const TIPOS: { valor: TipoEnum; label: string }[] = [
  { valor: 'character', label: 'Personagem' },
  { valor: 'weapon', label: 'Arma / Cone' },
  { valor: 'standard', label: 'Padrão (sempre ativo)' },
];

export default function TiposBanner() {
  const [tipos, setTipos] = useState<TipoBanner[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [edicoes, setEdicoes] = useState<Record<string, string>>({});

  const [novoGameId, setNovoGameId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoEnum>('character');
  const [novoHardPity, setNovoHardPity] = useState('90');
  const [novoSoftPity, setNovoSoftPity] = useState('74');

  const carregar = useCallback(async () => {
    const listaJogos = await listarJogos(db);
    setJogos(listaJogos);
    setTipos(await getBannerTypesComJogo(db));
    setNovoGameId((atual) => atual ?? listaJogos[0]?.id ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function salvarSoftPity(tipoId: string) {
    const valor = Number(edicoes[tipoId]);
    if (!Number.isInteger(valor) || valor <= 0) return;
    await atualizarSoftPityRef(db, tipoId, valor);
    carregar();
  }

  async function adicionar() {
    if (!novoGameId || !novoNome.trim()) return;
    const hardPity = Number(novoHardPity);
    const softPityRef = Number(novoSoftPity);
    if (!Number.isInteger(hardPity) || hardPity <= 0 || !Number.isInteger(softPityRef) || softPityRef <= 0) return;

    await criarBannerType(db, { gameId: novoGameId, nome: novoNome.trim(), tipo: novoTipo, hardPity, softPityRef });
    setNovoNome('');
    carregar();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {tipos.map((t) => (
          <View key={t.id} style={styles.tipoLinha}>
            <View style={styles.tipoInfo}>
              <Text style={styles.tipoNome}>
                {t.gameNome} · {t.nome}
              </Text>
              <Text style={styles.tipoHint}>hard pity {t.hardPity} (fixo)</Text>
            </View>
            <TextInput
              style={styles.inputPequeno}
              keyboardType="number-pad"
              defaultValue={String(t.softPityRef)}
              onChangeText={(v) => setEdicoes((prev) => ({ ...prev, [t.id]: v }))}
              onBlur={() => salvarSoftPity(t.id)}
            />
          </View>
        ))}

        <Text style={styles.secao}>Novo tipo de banner</Text>
        <View style={styles.chips}>
          {jogos.map((j) => (
            <Pressable
              key={j.id}
              style={[styles.chip, novoGameId === j.id && styles.chipAtivo]}
              onPress={() => setNovoGameId(j.id)}
            >
              <Text style={[styles.chipTexto, novoGameId === j.id && styles.chipTextoAtivo]}>{j.nome}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chips}>
          {TIPOS.map((t) => (
            <Pressable
              key={t.valor}
              style={[styles.chip, novoTipo === t.valor && styles.chipAtivo]}
              onPress={() => setNovoTipo(t.valor)}
            >
              <Text style={[styles.chipTexto, novoTipo === t.valor && styles.chipTextoAtivo]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Nome (ex: Personagem)" value={novoNome} onChangeText={setNovoNome} />

        <View style={styles.linhaPity}>
          <View style={styles.pityCampo}>
            <Text style={styles.pityLabel}>Hard pity</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={novoHardPity} onChangeText={setNovoHardPity} />
          </View>
          <View style={styles.pityCampo}>
            <Text style={styles.pityLabel}>Soft pity</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={novoSoftPity} onChangeText={setNovoSoftPity} />
          </View>
        </View>

        <Pressable style={styles.botao} onPress={adicionar}>
          <Text style={styles.botaoTexto}>Criar tipo de banner</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 8, paddingBottom: 60 },
  tipoLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tipoInfo: { flex: 1 },
  tipoNome: { fontSize: 14, fontWeight: '600' },
  tipoHint: { fontSize: 11, color: '#999' },
  inputPequeno: { width: 60, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, textAlign: 'center' },
  secao: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 18, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#eee' },
  chipAtivo: { backgroundColor: '#3f51b5' },
  chipTexto: { fontSize: 13, color: '#444', fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 },
  linhaPity: { flexDirection: 'row', gap: 12 },
  pityCampo: { flex: 1 },
  pityLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
  botao: { backgroundColor: '#3f51b5', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontWeight: '700' },
});
