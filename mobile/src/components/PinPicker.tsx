import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { LatLng } from '../domain/types';
import { mapHtml } from '../map/mapHtml';
import { colors } from '../theme';
import { Button, styles as ui } from './ui';

const PIN_SIZE = 44;

/** RF09: a usuária arrasta o mapa até o pino fixo ficar sobre o local. */
export function PinPicker({ visible, start, onConfirm, onClose }: { visible: boolean; start: LatLng; onConfirm: (point: LatLng) => void; onClose: () => void }) {
  const center = useRef(start);
  // a página do mapa é recriada a cada abertura, já centrada no ponto atual
  const html = useMemo(() => mapHtml(start, 17), [start.latitude, start.longitude, visible]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'bounds') center.current = message.center;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => (center.current = start)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
        <Text style={[ui.muted, { padding: 16 }]}>Arraste o mapa até o pino ficar sobre a entrada do local.</Text>
        <View style={{ flex: 1 }}>
          <WebView source={{ html, baseUrl: 'https://gosafe.app/' }} originWhitelist={['*']} onMessage={onMessage} style={{ flex: 1, backgroundColor: colors.map }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -PIN_SIZE / 2, marginTop: -PIN_SIZE }}>
            <Ionicons name="location" size={PIN_SIZE} color={colors.primary} />
          </View>
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          <Button label="Usar esta posição" onPress={() => onConfirm(center.current)} />
          <Button label="Cancelar" variant="ghost" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
