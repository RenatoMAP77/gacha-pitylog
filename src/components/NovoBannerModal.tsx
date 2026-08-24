import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  bannerTypeNome: string;
  onConfirmar: (nome: string, apelido: string) => void;
  onCancelar: () => void;
}

export function NovoBannerModal({ visible, bannerTypeNome, onConfirmar, onCancelar }: Props) {
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');

  function confirmar() {
    if (!nome.trim()) return;
    onConfirmar(nome.trim(), apelido.trim());
    setNome('');
    setApelido('');
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Novo banner · {bannerTypeNome}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do banner (ex: Mydei)"
            value={nome}
            onChangeText={setNome}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Apelido / comentário (opcional)"
            value={apelido}
            onChangeText={setApelido}
          />
          <View style={styles.botoes}>
            <Pressable style={styles.botaoCancelar} onPress={onCancelar}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.botaoConfirmar} onPress={confirmar}>
              <Text style={styles.botaoConfirmarTexto}>Criar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: '#fff', borderRadius: 14, padding: 20, gap: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15 },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  botaoCancelar: { paddingVertical: 8, paddingHorizontal: 14 },
  botaoCancelarTexto: { color: '#777', fontWeight: '600' },
  botaoConfirmar: { backgroundColor: '#3f51b5', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  botaoConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
