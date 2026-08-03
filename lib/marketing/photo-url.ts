/** Same-origin proxy URL — private bucket objects are never exposed via S3_PUBLIC_URL. */
export function photoProxyUrl(itemId: string, photoId: string): string {
  return `/api/marketing/items/${itemId}/photos/${photoId}/file`;
}
