import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

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

  function removeQueryParams(name: string) {
    const urlSearchParams = new URLSearchParams(searchParams);
    urlSearchParams.delete(name);
  }

  function updateQueryParams(name: string, value: string) {
    const urlSearchParams = new URLSearchParams(searchParams);

    urlSearchParams.set(name, value);
    if (!urlSearchParams.get(name)) urlSearchParams.delete(name);

    router.push(`${pathname}?${urlSearchParams.toString()}`, {
      scroll: false,
    });
  }

  function getQueryParams(name: string) {
    return searchParams.get(name);
  }

  useEffect(
    function () {
      const queryNames = searchParams
        .toString()
        .split('&')
        .map((param) => param.split('=')[0]);

      queryNames.forEach((name) => {
        if (!searchParams.get(name)) removeQueryFromURL(name);
      });
    },
    [pathname, removeQueryFromURL, searchParams]
  );

  return {
    updateQueryParams,
    getQueryParams,
    removeQueryParams,
    removeQueryFromURL,
  };
}
