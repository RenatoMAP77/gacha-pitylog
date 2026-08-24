import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { calcularDeltaAjuste } from '@/domain/pity';

interface Props {
  visible: boolean;
  bannerTypeNome: string;
  pityAtual: number;
  onConfirmar: (pityReal: number) => void;
  onCancelar: () => void;
}

export function CorrigirPityModal({ visible, bannerTypeNome, pityAtual, onConfirmar, onCancelar }: Props) {
  const [valor, setValor] = useState(String(pityAtual));

  const pityReal = Number(valor);
  const valido = Number.isInteger(pityReal) && pityReal >= 0;
  const delta = valido ? calcularDeltaAjuste(pityAtual, pityReal) : 0;

  function confirmar() {
    if (!valido) return;
    onConfirmar(pityReal);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Corrigir pity · {bannerTypeNome}</Text>
          <Text style={styles.hint}>Confira no histórico de wishes/warps do jogo e informe o pity real.</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={valor}
            onChangeText={setValor}
            autoFocus
            selectTextOnFocus
          />
          {valido && delta !== 0 && (
            <Text style={styles.delta}>
              {delta > 0 ? `Isso vai adicionar ${delta} tiros ao histórico.` : `Isso vai remover ${-delta} tiros do histórico.`}
            </Text>
          )}
          {valido && delta === 0 && <Text style={styles.hint}>Sem alteração — pity já está correto.</Text>}
          <View style={styles.botoes}>
            <Pressable style={styles.botaoCancelar} onPress={onCancelar}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.botaoConfirmar, !valido && styles.botaoDesabilitado]} onPress={confirmar} disabled={!valido}>
              <Text style={styles.botaoConfirmarTexto}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: '#fff', borderRadius: 14, padding: 20, gap: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, color: '#777' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 18, textAlign: 'center' },
  delta: { fontSize: 13, color: '#e67e22', fontWeight: '600' },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  botaoCancelar: { paddingVertical: 8, paddingHorizontal: 14 },
  botaoCancelarTexto: { color: '#777', fontWeight: '600' },
  botaoConfirmar: { backgroundColor: '#3f51b5', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  botaoDesabilitado: { opacity: 0.4 },
  botaoConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
