import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { getDefaultAccountId, seedDatabase } from '@/db/seed';
import { useAccountStore } from '@/store/accountStore';

export default function RootLayout() {
  const { success: migrationsOk, error: migrationsError } = useMigrations(db, migrations);
  const [seedOk, setSeedOk] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);
  const setActiveAccountId = useAccountStore((s) => s.setActiveAccountId);

  useEffect(() => {
    if (!migrationsOk) return;
    (async () => {
      try {
        await seedDatabase(db);
        const accountId = await getDefaultAccountId(db);
        setActiveAccountId(accountId);
        setSeedOk(true);
      } catch (err) {
        setSeedError(err as Error);
      }
    })();
  }, [migrationsOk, setActiveAccountId]);

  if (migrationsError || seedError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro ao iniciar o banco de dados</Text>
        <Text style={styles.errorDetail}>{String(migrationsError ?? seedError)}</Text>
      </View>
    );
  }

  if (!migrationsOk || !seedOk) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="index" options={{ title: 'Pity Tracker' }} />
        <Stack.Screen name="registrar" options={{ title: 'Registrar tiro', presentation: 'modal' }} />
        <Stack.Screen name="historico" options={{ title: 'Histórico' }} />
        <Stack.Screen name="config" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#c0392b' },
  errorDetail: { fontSize: 12, color: '#555', textAlign: 'center' },
});
