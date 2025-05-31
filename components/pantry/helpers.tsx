export function isExpired(expiryDate: Date): boolean {
  return expiryDate < new Date();
}

export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
