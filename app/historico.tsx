import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterAvatar } from '@/components/CharacterAvatar';
import { db } from '@/db/client';
import { excluirPullLog, listarHistoricoDaConta } from '@/services/pullLogs';
import { useAccountStore } from '@/store/accountStore';

type Registro = Awaited<ReturnType<typeof listarHistoricoDaConta>>[number];

export default function Historico() {
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [somente5Estrela, setSomente5Estrela] = useState(false);

  const carregar = useCallback(async () => {
    if (!activeAccountId) return;
    setRegistros(await listarHistoricoDaConta(db, activeAccountId));
  }, [activeAccountId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function confirmarExclusao(registro: Registro) {
    Alert.alert('Excluir registro?', formatarLinha(registro), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirPullLog(db, registro.id);
          carregar();
        },
      },
    ]);
  }

  const listaFiltrada = somente5Estrela ? registros.filter((r) => r.veio5Estrela) : registros;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.filtros}>
        <Text style={styles.filtroLabel}>Só 5★</Text>
        <Switch value={somente5Estrela} onValueChange={setSomente5Estrela} />
      </View>
      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Pressable style={[styles.linha, item.tipoRegistro === 'ajuste' && styles.linhaAjuste]} onLongPress={() => confirmarExclusao(item)}>
            <View style={styles.linhaConteudo}>
              {item.veio5Estrela && (
                <CharacterAvatar nome={item.characterNome ?? '?'} imageUrl={item.characterImageUrl} size={40} />
              )}
              <View style={styles.linhaTexto}>
                <View style={styles.linhaHeader}>
                  <Text style={styles.linhaBanner}>{item.bannerApelido ?? item.bannerNome}</Text>
                  <Text style={styles.linhaData}>{formatarData(item.data)}</Text>
                </View>
                <Text style={styles.linhaQtd}>
                  {item.tipoRegistro === 'ajuste' ? '⚙️ ajuste ' : ''}
                  {item.qtdTiros > 0 ? '+' : ''}
                  {item.qtdTiros} tiro{Math.abs(item.qtdTiros) === 1 ? '' : 's'}
                  {item.veio5Estrela ? ` · 5★ ${item.characterNome ?? ''}` : ''}
                  {item.perdeu5050 === true ? ' · perdeu 50/50' : ''}
                </Text>
                {item.obs && <Text style={styles.linhaObs}>{item.obs}</Text>}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum registro ainda.</Text>}
      />
    </SafeAreaView>
  );
}

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarLinha(r: Registro) {
  return `${r.bannerApelido ?? r.bannerNome} · ${r.qtdTiros} tiros`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  filtros: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  filtroLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  lista: { padding: 16, gap: 10 },
  linha: { backgroundColor: '#f7f7f9', borderRadius: 10, padding: 12 },
  linhaAjuste: { backgroundColor: '#fdf3e0', borderLeftWidth: 3, borderLeftColor: '#e67e22' },
  linhaConteudo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  linhaTexto: { flex: 1, gap: 4 },
  linhaHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  linhaBanner: { fontWeight: '700', fontSize: 13, color: '#333' },
  linhaData: { fontSize: 11, color: '#999' },
  linhaQtd: { fontSize: 13, color: '#444' },
  linhaObs: { fontSize: 12, color: '#777', fontStyle: 'italic' },
  vazio: { textAlign: 'center', color: '#999', marginTop: 40 },
});
