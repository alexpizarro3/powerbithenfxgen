import { useEffect, useRef } from 'react';

export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
) {
  const saved = useRef(listener);
  useEffect(() => { saved.current = listener; }, [listener]);
  useEffect(() => {
    const handler = (e: any) => saved.current(e);
    window.addEventListener(type, handler, options);
    return () => window.removeEventListener(type, handler, options);
  }, [type, options]);
}
