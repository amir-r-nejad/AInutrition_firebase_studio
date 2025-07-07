import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useQueryParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function updateQueryParams(name: string, value: string) {
    const urlSearchParams = new URLSearchParams(searchParams);

    if (!urlSearchParams.get(name)) urlSearchParams.delete(name);
    else urlSearchParams.set(name, value);

    router.push(`${pathname}?${urlSearchParams.toString()}`);
  }

  function removeQueryParams(name: string) {
    const urlSearchParams = new URLSearchParams(searchParams);
    urlSearchParams.delete(name);

    router.push(`${pathname}?${urlSearchParams.toString()}`);
  }

  function getQueryParams(name: string) {
    return searchParams.get(name);
  }

  return { updateQueryParams, getQueryParams, removeQueryParams };
}
