import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterPickerGrid, type CharacterSelecionado } from '@/components/CharacterPickerGrid';
import { db } from '@/db/client';
import { ativarBanner, criarBannerEAtivar, getActiveBanner, listarBannersDoTipo } from '@/services/banners';
import { type GameComTipos, getGamesComBannerTypes } from '@/services/catalog';
import { getOuCriarCharacter, registrarPull } from '@/services/pullLogs';
import { useAccountStore } from '@/store/accountStore';

type Banner = { id: string; nome: string; apelido: string | null };

export default function Registrar() {
  const router = useRouter();
  const activeAccountId = useAccountStore((s) => s.activeAccountId);

  const [jogos, setJogos] = useState<GameComTipos[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [bannerTypeId, setBannerTypeId] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [novoBannerNome, setNovoBannerNome] = useState('');

  const [qtdTiros, setQtdTiros] = useState('1');
  const [veio5Estrela, setVeio5Estrela] = useState(false);
  const [personagem, setPersonagem] = useState<CharacterSelecionado | null>(null);
  const [perdeu5050, setPerdeu5050] = useState<boolean | null>(null);
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getGamesComBannerTypes(db).then((data) => {
      setJogos(data);
      if (data.length > 0) {
        setGameId(data[0].gameId);
        if (data[0].tipos.length > 0) setBannerTypeId(data[0].tipos[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!bannerTypeId) return;
    (async () => {
      const lista = await listarBannersDoTipo(db, bannerTypeId);
      setBanners(lista);
      const ativo = await getActiveBanner(db, bannerTypeId);
      setBannerId(ativo?.id ?? lista[0]?.id ?? null);
    })();
  }, [bannerTypeId]);

  const tipoAtual = useMemo(
    () => jogos.find((j) => j.gameId === gameId)?.tipos.find((t) => t.id === bannerTypeId),
    [jogos, gameId, bannerTypeId]
  );

  const mostraPerdeu5050 = veio5Estrela && tipoAtual?.tipo !== 'standard';

  async function criarNovoBanner() {
    if (!bannerTypeId || !novoBannerNome.trim()) return;
    const id = await criarBannerEAtivar(db, { bannerTypeId, nome: novoBannerNome.trim() });
    setBanners(await listarBannersDoTipo(db, bannerTypeId));
    setBannerId(id);
    setNovoBannerNome('');
  }

  async function salvar(continuar: boolean) {
    if (!activeAccountId || !bannerId || !gameId) return;
    const qtd = Number(qtdTiros);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      Alert.alert('Quantidade inválida', 'Informe um número de tiros maior que zero.');
      return;
    }
    if (veio5Estrela && !personagem?.nome.trim()) {
      Alert.alert('Falta o personagem', 'Informe quem veio no 5★.');
      return;
    }

    setSalvando(true);
    try {
      let characterId: string | null = null;
      if (veio5Estrela && personagem) {
        characterId =
          personagem.id ??
          (await getOuCriarCharacter(db, {
            gameId,
            nome: personagem.nome.trim(),
            tipoItem: tipoAtual?.tipo === 'weapon' ? 'weapon' : 'character',
          }));
      }

      await registrarPull(db, {
        accountId: activeAccountId,
        bannerId,
        qtdTiros: qtd,
        veio5Estrela,
        characterId,
        perdeu5050: mostraPerdeu5050 ? perdeu5050 : null,
        obs: obs.trim() || null,
      });

      if (continuar) {
        setQtdTiros('1');
        setVeio5Estrela(false);
        setPersonagem(null);
        setPerdeu5050(null);
        setObs('');
        Alert.alert('Registrado!', 'Pode registrar o próximo 5★ deste banner.');
      } else {
        router.back();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Jogo</Text>
        <View style={styles.chips}>
          {jogos.map((j) => (
            <Pressable
              key={j.gameId}
              style={[styles.chip, gameId === j.gameId && styles.chipAtivo]}
              onPress={() => {
                setGameId(j.gameId);
                setBannerTypeId(j.tipos[0]?.id ?? null);
              }}
            >
              <Text style={[styles.chipTexto, gameId === j.gameId && styles.chipTextoAtivo]}>{j.gameNome}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Tipo de banner</Text>
        <View style={styles.chips}>
          {jogos
            .find((j) => j.gameId === gameId)
            ?.tipos.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.chip, bannerTypeId === t.id && styles.chipAtivo]}
                onPress={() => setBannerTypeId(t.id)}
              >
                <Text style={[styles.chipTexto, bannerTypeId === t.id && styles.chipTextoAtivo]}>{t.nome}</Text>
              </Pressable>
            ))}
        </View>

        <Text style={styles.label}>Banner</Text>
        <View style={styles.chips}>
          {banners.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.chip, bannerId === b.id && styles.chipAtivo]}
              onPress={async () => {
                setBannerId(b.id);
                if (bannerTypeId) await ativarBanner(db, b.id, bannerTypeId);
              }}
            >
              <Text style={[styles.chipTexto, bannerId === b.id && styles.chipTextoAtivo]}>{b.apelido ?? b.nome}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.novoBannerRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="+ novo banner"
            value={novoBannerNome}
            onChangeText={setNovoBannerNome}
            onSubmitEditing={criarNovoBanner}
          />
          <Pressable style={styles.botaoSecundario} onPress={criarNovoBanner}>
            <Text style={styles.botaoSecundarioTexto}>Criar</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Quantidade de tiros</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={qtdTiros}
          onChangeText={setQtdTiros}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Veio 5★?</Text>
          <Switch value={veio5Estrela} onValueChange={setVeio5Estrela} />
        </View>

        {veio5Estrela && gameId && (
          <>
            <Text style={styles.label}>Personagem / arma</Text>
            <CharacterPickerGrid
              gameId={gameId}
              tipoItem={tipoAtual?.tipo === 'weapon' ? 'weapon' : 'character'}
              selecionado={personagem}
              onSelecionar={setPersonagem}
            />

            {mostraPerdeu5050 && (
              <View style={styles.switchRow}>
                <Text style={styles.label}>Perdeu o 50/50?</Text>
                <Switch value={perdeu5050 === true} onValueChange={(v) => setPerdeu5050(v)} />
              </View>
            )}
          </>
        )}

        <Text style={styles.label}>Comentário</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Comentário livre"
          value={obs}
          onChangeText={setObs}
          multiline
        />

        <View style={styles.botoesFinais}>
          <Pressable style={styles.botaoPrimario} disabled={salvando} onPress={() => salvar(false)}>
            <Text style={styles.botaoPrimarioTexto}>Salvar</Text>
          </Pressable>
          {veio5Estrela && (
            <Pressable style={styles.botaoSecundario} disabled={salvando} onPress={() => salvar(true)}>
              <Text style={styles.botaoSecundarioTexto}>Salvar + outro 5★</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  form: { padding: 16, gap: 8, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#eee' },
  chipAtivo: { backgroundColor: '#3f51b5' },
  chipTexto: { fontSize: 13, color: '#444', fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15 },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  inputFlex: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14 },
  novoBannerRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botoesFinais: { marginTop: 20, gap: 10 },
  botaoPrimario: { backgroundColor: '#3f51b5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  botaoPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botaoSecundario: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#eee', alignItems: 'center' },
  botaoSecundarioTexto: { color: '#444', fontWeight: '700' },
});
