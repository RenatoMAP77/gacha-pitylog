import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { criarJogo, listarJogos, tornarJogoPrincipal } from '@/services/catalog';

type Jogo = Awaited<ReturnType<typeof listarJogos>>[number];

export default function Jogos() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [novoJogo, setNovoJogo] = useState('');

  const carregar = useCallback(async () => {
    setJogos(await listarJogos(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function adicionar() {
    if (!novoJogo.trim()) return;
    await criarJogo(db, novoJogo.trim());
    setNovoJogo('');
    carregar();
  }

  async function tornarPrincipal(gameId: string) {
    await tornarJogoPrincipal(db, gameId);
    carregar();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.hint}>
          O jogo do topo é o primeiro a aparecer no dashboard. Um jogo novo aqui ainda precisa de tipos de banner
          (aba "Tipos de banner") antes de mostrar cards.
        </Text>
        {jogos.map((jogo, i) => (
          <View key={jogo.id} style={styles.linha}>
            <View style={styles.linhaInfo}>
              <Text style={styles.linhaOrdem}>{i + 1}º</Text>
              <Text style={styles.linhaNome}>{jogo.nome}</Text>
            </View>
            {i !== 0 && (
              <Pressable style={styles.botaoSecundario} onPress={() => tornarPrincipal(jogo.id)}>
                <Text style={styles.botaoSecundarioTexto}>Tornar principal</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Text style={styles.secao}>Novo jogo</Text>
        <View style={styles.novoRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Nome (ex: Zenless Zone Zero)"
            value={novoJogo}
            onChangeText={setNovoJogo}
            onSubmitEditing={adicionar}
          />
          <Pressable style={styles.botao} onPress={adicionar}>
            <Text style={styles.botaoTexto}>Criar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 8, paddingBottom: 60 },
  hint: { fontSize: 12, color: '#999', marginBottom: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linhaOrdem: { fontSize: 12, color: '#999', fontWeight: '700', width: 24 },
  linhaNome: { fontSize: 15, fontWeight: '600' },
  botaoSecundario: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#eee' },
  botaoSecundarioTexto: { color: '#444', fontWeight: '600', fontSize: 12 },
  secao: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 18, marginBottom: 4 },
  novoRow: { flexDirection: 'row', gap: 8 },
  inputFlex: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14 },
  botao: { backgroundColor: '#3f51b5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '700' },
});
