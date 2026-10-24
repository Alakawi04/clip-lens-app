import { useEffect, useState } from 'react';

export const FINE_POINTER_QUERY = '(min-width: 641px) and (hover: hover) and (pointer: fine)';
export const LARGE_FINE_POINTER_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(query).matches
  ));

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    if (media.addEventListener) media.addEventListener('change', update);
    else media.addListener(update);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', update);
      else media.removeListener(update);
    };
  }, [query]);

  return matches;
}

export function useFinePointer() {
  return useMediaQuery(FINE_POINTER_QUERY);
}
