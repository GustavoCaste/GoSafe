import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from '../domain/types';

let lastKnown: LatLng | null = null;
const listeners = new Set<(position: LatLng) => void>();
const FIX_TIMEOUT_MS = 10_000;

export interface Fix extends LatLng {
  accuracy: number;
}

/** Pede permissão de localização (primeiro acesso). */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

function timeout<T>(ms: number): Promise<T | null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

/**
 * Posição atual com a precisão informada pelo GPS; null se não houver
 * permissão. Dentro de casa o GPS pode demorar muito: depois de 10 s usa a
 * última posição conhecida do aparelho (com a precisão dela).
 */
export async function currentFix(): Promise<Fix | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location =
    (await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null),
      timeout<Location.LocationObject>(FIX_TIMEOUT_MS),
    ])) ?? (await Location.getLastKnownPositionAsync().catch(() => null));

  if (!location) return null;

  const fix = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? 999,
  };
  lastKnown = fix;
  listeners.forEach((listener) => listener(fix));
  return fix;
}

/** Última posição conhecida da usuária (para distâncias e para centralizar o mapa). */
export function useLastKnownPosition(): LatLng | null {
  const [position, setPosition] = useState<LatLng | null>(lastKnown);

  useEffect(() => {
    listeners.add(setPosition);
    if (!lastKnown) currentFix().catch(() => undefined);
    return () => {
      listeners.delete(setPosition);
    };
  }, []);

  return position;
}
