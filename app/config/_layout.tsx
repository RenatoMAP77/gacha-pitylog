import { Stack } from 'expo-router';

export default function ConfigLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="index" options={{ title: 'Configurações' }} />
      <Stack.Screen name="jogos" options={{ title: 'Jogos' }} />
      <Stack.Screen name="tipos-banner" options={{ title: 'Tipos de banner' }} />
      <Stack.Screen name="personagens" options={{ title: 'Personagens' }} />
    </Stack>
  );
}
