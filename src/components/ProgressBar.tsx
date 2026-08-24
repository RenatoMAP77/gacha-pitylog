import type { DimensionValue } from 'react-native';
import { StyleSheet, View } from 'react-native';

interface Props {
  pityAtual: number;
  softPityRef: number;
  hardPity: number;
}

export function ProgressBar({ pityAtual, softPityRef, hardPity }: Props) {
  const asPercent = (n: number): DimensionValue => `${Math.min(100, Math.max(0, n))}%`;
  const pctDoPity = (n: number) => (n / hardPity) * 100;
  const naZona = pityAtual >= softPityRef;

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.softZone,
          { left: asPercent(pctDoPity(softPityRef)), width: asPercent(100 - pctDoPity(softPityRef)) },
        ]}
      />
      <View style={[styles.fill, { width: asPercent(pctDoPity(pityAtual)), backgroundColor: naZona ? '#e67e22' : '#3f51b5' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  softZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#fce4c2',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
});
