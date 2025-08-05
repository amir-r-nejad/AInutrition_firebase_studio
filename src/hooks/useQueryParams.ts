import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useQueryParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const removeQueryFromURL = useCallback(
    (name: string) => {
      const urlSearchParams = new URLSearchParams(searchParams);
      urlSearchParams.delete(name);

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const removeQueryParams = useCallback(
    (name: string | string[]) => {
      const urlSearchParams = new URLSearchParams(searchParams);

      if (typeof name === 'string') urlSearchParams.delete(name);

      if (typeof name === 'object') {
        name.forEach((key) => urlSearchParams.delete(key));
      }

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const updateQueryParams = useCallback(
    (name: string | string[], value: string | string[]) => {
      const urlSearchParams = new URLSearchParams(searchParams);

      if (typeof name === 'string' && typeof value === 'string')
        urlSearchParams.set(name, value);
      if (typeof name === 'string' && !urlSearchParams.get(name))
        urlSearchParams.delete(name);

      if (typeof name == 'object' && typeof value == 'object')
        name.forEach((key, i) => urlSearchParams.set(key, value[i]));
      if (
        typeof name === 'object' &&
        name.some((key) => !urlSearchParams.get(key))
      )
        name.forEach((key) => urlSearchParams.delete(key));

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const updateAndRemoveQueryParams = useCallback(
    (toUpdate: { [key: string]: string }, toRemove: string | string[]) => {
      const urlSearchParams = new URLSearchParams(searchParams);

      if (typeof toRemove === 'string') urlSearchParams.delete(toRemove);
      else toRemove.forEach((key) => urlSearchParams.delete(key));

      Object.entries(toUpdate).forEach(([key, value]) =>
        urlSearchParams.set(key, value)
      );

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  function getQueryParams(name: string) {
    return searchParams.get(name);
  }

  return {
    updateQueryParams,
    getQueryParams,
    removeQueryParams,
    removeQueryFromURL,
    updateAndRemoveQueryParams,
  };
}
