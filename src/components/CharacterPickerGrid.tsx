import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { db } from '@/db/client';
import { listarPersonagens, type Personagem } from '@/services/characters';

import { CharacterAvatar } from './CharacterAvatar';

export interface CharacterSelecionado {
  id: string | null; // null = nome digitado, ainda não existe em `characters`
  nome: string;
}

interface Props {
  gameId: string;
  tipoItem: 'character' | 'weapon';
  selecionado: CharacterSelecionado | null;
  onSelecionar: (opcao: CharacterSelecionado) => void;
}

export function CharacterPickerGrid({ gameId, tipoItem, selecionado, onSelecionar }: Props) {
  const [opcoes, setOpcoes] = useState<Personagem[]>([]);
  const [modoLivre, setModoLivre] = useState(false);
  const [nomeLivre, setNomeLivre] = useState('');

  useEffect(() => {
    listarPersonagens(db, { gameId, tipoItem }).then(setOpcoes);
  }, [gameId, tipoItem]);

  function escolherLivre(nome: string) {
    setNomeLivre(nome);
    onSelecionar({ id: null, nome });
  }

  return (
    <View>
      <View style={styles.grid}>
        {opcoes.map((p) => {
          const ativo = !modoLivre && selecionado?.id === p.id;
          return (
            <Pressable
              key={p.id}
              style={styles.item}
              onPress={() => {
                setModoLivre(false);
                onSelecionar({ id: p.id, nome: p.nome });
              }}
            >
              <View style={[styles.avatarWrap, ativo && styles.avatarWrapAtivo]}>
                <CharacterAvatar nome={p.nome} imageUrl={p.imageUrl} />
              </View>
              <Text style={styles.itemNome} numberOfLines={1}>
                {p.nome}
              </Text>
            </Pressable>
          );
        })}

        <Pressable style={styles.item} onPress={() => setModoLivre(true)}>
          <View style={[styles.avatarWrap, styles.outroCirculo, modoLivre && styles.avatarWrapAtivo]}>
            <Text style={styles.outroTexto}>+</Text>
          </View>
          <Text style={styles.itemNome}>outro</Text>
        </Pressable>
      </View>

      {modoLivre && (
        <TextInput
          style={styles.input}
          placeholder="Nome do personagem/arma"
          value={nomeLivre}
          onChangeText={escolherLivre}
          autoFocus
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { alignItems: 'center', width: 64, gap: 4 },
  avatarWrap: { borderRadius: 30, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  avatarWrapAtivo: { borderColor: '#3f51b5' },
  outroCirculo: { backgroundColor: '#eee', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  outroTexto: { fontSize: 26, color: '#888', lineHeight: 28 },
  itemNome: { fontSize: 10, color: '#555', maxWidth: 64, textAlign: 'center' },
  input: { marginTop: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14 },
});
