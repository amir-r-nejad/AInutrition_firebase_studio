export function isNotValidURL(
  next: string | null,
  token: string | null,
  type: string | null
) {
  return (
    !token ||
    !type ||
    !next ||
    !token?.startsWith('pkce') ||
    type !== 'recovery' ||
    next !== '/reset-password'
  );
}
