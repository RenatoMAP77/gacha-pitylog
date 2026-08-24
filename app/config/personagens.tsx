import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterAvatar } from '@/components/CharacterAvatar';
import { db } from '@/db/client';
import { listarJogos } from '@/services/catalog';
import { criarPersonagem, excluirPersonagem, listarPersonagens, type Personagem } from '@/services/characters';

type Jogo = Awaited<ReturnType<typeof listarJogos>>[number];
type TipoItem = 'character' | 'weapon' | 'lightcone';

const TIPOS_ITEM: { valor: TipoItem; label: string }[] = [
  { valor: 'character', label: 'Personagem' },
  { valor: 'weapon', label: 'Arma' },
  { valor: 'lightcone', label: 'Cone de luz' },
];

export default function Personagens() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [personagens, setPersonagens] = useState<Personagem[]>([]);

  const [nome, setNome] = useState('');
  const [tipoItem, setTipoItem] = useState<TipoItem>('character');
  const [raridade, setRaridade] = useState<4 | 5>(5);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    listarJogos(db).then((lista) => {
      setJogos(lista);
      setGameId((atual) => atual ?? lista[0]?.id ?? null);
    });
  }, []);

  const carregarPersonagens = useCallback(async () => {
    if (!gameId) return;
    setPersonagens(await listarPersonagens(db, { gameId }));
  }, [gameId]);

  useFocusEffect(
    useCallback(() => {
      carregarPersonagens();
    }, [carregarPersonagens])
  );

  async function adicionar() {
    if (!gameId || !nome.trim()) return;
    await criarPersonagem(db, { gameId, nome: nome.trim(), tipoItem, raridade, imageUrl: imageUrl.trim() });
    setNome('');
    setImageUrl('');
    carregarPersonagens();
  }

  function confirmarExclusao(p: Personagem) {
    Alert.alert('Excluir personagem?', p.nome, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirPersonagem(db, p.id);
          carregarPersonagens();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.chips}>
          {jogos.map((j) => (
            <Pressable key={j.id} style={[styles.chip, gameId === j.id && styles.chipAtivo]} onPress={() => setGameId(j.id)}>
              <Text style={[styles.chipTexto, gameId === j.id && styles.chipTextoAtivo]}>{j.nome}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>Toque e segure num personagem pra excluir.</Text>
        <View style={styles.grid}>
          {personagens.map((p) => (
            <Pressable key={p.id} style={styles.item} onLongPress={() => confirmarExclusao(p)}>
              <CharacterAvatar nome={p.nome} imageUrl={p.imageUrl} size={56} />
              <Text style={styles.itemNome} numberOfLines={1}>
                {p.nome}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.secao}>Novo personagem</Text>
        <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
        <TextInput
          style={styles.input}
          placeholder="URL da foto (opcional — sem foto vira um círculo com a inicial)"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
        />

        <View style={styles.chips}>
          {TIPOS_ITEM.map((t) => (
            <Pressable
              key={t.valor}
              style={[styles.chip, tipoItem === t.valor && styles.chipAtivo]}
              onPress={() => setTipoItem(t.valor)}
            >
              <Text style={[styles.chipTexto, tipoItem === t.valor && styles.chipTextoAtivo]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chips}>
          {[5, 4].map((r) => (
            <Pressable key={r} style={[styles.chip, raridade === r && styles.chipAtivo]} onPress={() => setRaridade(r as 4 | 5)}>
              <Text style={[styles.chipTexto, raridade === r && styles.chipTextoAtivo]}>{r}★</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.botao} onPress={adicionar}>
          <Text style={styles.botaoTexto}>Adicionar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 8, paddingBottom: 60 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#eee' },
  chipAtivo: { backgroundColor: '#3f51b5' },
  chipTexto: { fontSize: 13, color: '#444', fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  hint: { fontSize: 12, color: '#999' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginVertical: 8 },
  item: { alignItems: 'center', width: 64, gap: 4 },
  itemNome: { fontSize: 11, color: '#444', maxWidth: 64, textAlign: 'center' },
  secao: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 },
  botao: { backgroundColor: '#3f51b5', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontWeight: '700' },
});
