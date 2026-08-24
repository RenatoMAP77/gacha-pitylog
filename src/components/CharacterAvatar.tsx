import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  nome: string;
  imageUrl: string | null;
  size?: number;
}

export function CharacterAvatar({ nome, imageUrl, size = 56 }: Props) {
  const dimensao = { width: size, height: size, borderRadius: size / 2 };

  if (!imageUrl) {
    return (
      <View style={[styles.placeholder, dimensao]}>
        <Text style={[styles.inicial, { fontSize: size * 0.4 }]}>{nome.charAt(0).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[styles.imagem, dimensao]}
      contentFit="cover"
      transition={150}
      placeholder={{ blurhash: 'L4B|s;00~q00_39F%MRj00Rj00xu' }}
    />
  );
}

const styles = StyleSheet.create({
  imagem: { backgroundColor: '#e8eaf6' },
  placeholder: {
    backgroundColor: '#c5cae9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: { color: '#3f51b5', fontWeight: '800' },
});
