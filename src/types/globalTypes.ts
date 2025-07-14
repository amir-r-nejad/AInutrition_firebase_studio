export type User = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null; // Add displayName property
  photoURL: string | null; // Add photoURL property
};
