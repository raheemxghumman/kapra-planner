const rupees = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** 4990 -> "Rs 4,990" */
export const formatPrice = (amount: number) => `Rs ${rupees.format(amount)}`;

/**
 * Asks the Shopify image CDN for a smaller copy (it resizes on the fly), so a product card
 * downloads ~40 KB instead of a 2 MB original. Other URLs are returned unchanged.
 */
export function imageUrl(url: string | undefined, width: number): string {
  if (!url) return '';
  if (!url.includes('cdn.shopify.com') && !url.includes('/cdn/shop/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}`;
}

/** "unstitched" -> "Unstitched", "sky blue" -> "Sky blue", "full_look" -> "Full look" */
export const labelOf = (value: string) => {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Joins class names, skipping empty ones: cn('a', false && 'b', 'c') -> "a c" */
export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');
