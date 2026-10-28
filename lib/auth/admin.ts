/** /admin s'ouvre seulement aux Comptes dont l'adresse est dans ADMIN_EMAILS (séparées par des virgules) : celui d'Antoine. */
export function estAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
