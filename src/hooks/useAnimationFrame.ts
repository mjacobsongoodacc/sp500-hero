import { useEffect, useRef } from 'react';

/**
 * Runs `callback` on every animation frame with the elapsed ms since last frame.
 * The callback ref is kept current so closures always see latest state.
 */
export function useAnimationFrame(callback: (deltaMs: number) => void): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    let frameId = 0;
    let prev = 0;

    const loop = (time: number) => {
      if (prev) {
        const delta = Math.min(time - prev, 100); // cap to avoid huge jumps
        cbRef.current(delta);
      }
      prev = time;
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);
}
