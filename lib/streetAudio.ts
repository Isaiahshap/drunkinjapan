let startAudioFn: (() => void) | null = null;

export function registerStreetAudioStart(fn: () => void) {
  startAudioFn = fn;
  return () => {
    if (startAudioFn === fn) startAudioFn = null;
  };
}

export function startStreetAudio() {
  startAudioFn?.();
}
