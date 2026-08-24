import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { criarConta, listarContas } from '@/services/accounts';

type Conta = Awaited<ReturnType<typeof listarContas>>[number];

export default function ConfigHome() {
  const router = useRouter();
  const [contas, setContas] = useState<Conta[]>([]);
  const [novaConta, setNovaConta] = useState('');

  const carregar = useCallback(async () => {
    setContas(await listarContas(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function adicionarConta() {
    if (!novaConta.trim()) return;
    await criarConta(db, novaConta.trim());
    setNovaConta('');
    carregar();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.secao}>Contas</Text>
        {contas.map((c) => (
          <View key={c.id} style={styles.contaLinha}>
            <Text style={styles.contaNome}>{c.nome}</Text>
            {c.isDefault && <Text style={styles.contaBadge}>padrão</Text>}
          </View>
        ))}
        <View style={styles.novaContaRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Nome da nova conta (ex: Smurf)"
            value={novaConta}
            onChangeText={setNovaConta}
            onSubmitEditing={adicionarConta}
          />
          <Pressable style={styles.botao} onPress={adicionarConta}>
            <Text style={styles.botaoTexto}>Adicionar</Text>
          </Pressable>
        </View>

        <Text style={styles.secao}>Catálogo</Text>
        <Pressable style={styles.link} onPress={() => router.push('/config/jogos')}>
          <Text style={styles.linkTexto}>Jogos</Text>
          <Text style={styles.linkHint}>reordenar, adicionar um novo jogo</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/config/tipos-banner')}>
          <Text style={styles.linkTexto}>Tipos de banner</Text>
          <Text style={styles.linkHint}>hard/soft pity, adicionar novo tipo</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/config/personagens')}>
          <Text style={styles.linkTexto}>Personagens</Text>
          <Text style={styles.linkHint}>fotos usadas nos grids de registro</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 8, paddingBottom: 60 },
  secao: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 18, marginBottom: 4 },
  contaLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  contaNome: { fontSize: 15 },
  contaBadge: { fontSize: 11, color: '#3f51b5', backgroundColor: '#e8eaf6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  novaContaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  inputFlex: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14 },
  botao: { backgroundColor: '#3f51b5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '700' },
  link: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  linkTexto: { fontSize: 15, fontWeight: '600', color: '#222' },
  linkHint: { fontSize: 12, color: '#999', marginTop: 2 },
});
