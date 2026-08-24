import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { CardDashboard } from '@/services/dashboard';

import { CharacterPickerGrid, type CharacterSelecionado } from './CharacterPickerGrid';

interface Props {
  visible: boolean;
  card: CardDashboard | null;
  onConfirmar: (params: { qtdTiros: number; personagem: CharacterSelecionado; perdeu5050: boolean | null }) => void;
  onCancelar: () => void;
}

export function RegistrarCincoEstrelasModal({ visible, card, onConfirmar, onCancelar }: Props) {
  const [qtdTiros, setQtdTiros] = useState('');
  const [personagem, setPersonagem] = useState<CharacterSelecionado | null>(null);
  const [perdeu5050, setPerdeu5050] = useState(false);

  if (!card) return null;

  const mostraPerdeu5050 = card.tipo !== 'standard';

  function limparEFechar() {
    setQtdTiros('');
    setPersonagem(null);
    setPerdeu5050(false);
    onCancelar();
  }

  function confirmar() {
    const qtd = Number(qtdTiros);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      Alert.alert('Quantidade inválida', 'Informe em qual tiro desde o último 5★ ele veio.');
      return;
    }
    if (!personagem || !personagem.nome.trim()) {
      Alert.alert('Falta o personagem', 'Toque numa foto ou escolha "outro" e digite o nome.');
      return;
    }
    onConfirmar({ qtdTiros: qtd, personagem, perdeu5050: mostraPerdeu5050 ? perdeu5050 : null });
    setQtdTiros('');
    setPersonagem(null);
    setPerdeu5050(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={limparEFechar}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Veio 5★! · {card.bannerAtivo?.apelido ?? card.bannerTypeNome}</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Quem veio?</Text>
            <CharacterPickerGrid
              gameId={card.gameId}
              tipoItem={card.tipo === 'weapon' ? 'weapon' : 'character'}
              selecionado={personagem}
              onSelecionar={setPersonagem}
            />

            <Text style={styles.label}>Em qual tiro (desde o último 5★)?</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder={`ex: ${card.status.pityAtual + 1}`}
              value={qtdTiros}
              onChangeText={setQtdTiros}
            />

            {mostraPerdeu5050 && (
              <View style={styles.switchRow}>
                <Text style={styles.label}>Perdeu o 50/50?</Text>
                <Switch value={perdeu5050} onValueChange={setPerdeu5050} />
              </View>
            )}
          </ScrollView>

          <View style={styles.botoes}>
            <Pressable style={styles.botaoCancelar} onPress={limparEFechar}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.botaoConfirmar} onPress={confirmar}>
              <Text style={styles.botaoConfirmarTexto}>Registrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, gap: 10, maxHeight: '85%' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  botaoCancelar: { paddingVertical: 10, paddingHorizontal: 14 },
  botaoCancelarTexto: { color: '#777', fontWeight: '600' },
  botaoConfirmar: { backgroundColor: '#3f51b5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  botaoConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
