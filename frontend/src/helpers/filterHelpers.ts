export function filterBySubstring(items: string[], query: string, exclude?: string[]): string[] {
  const lower = query.toLowerCase();
  return items.filter(
    (item) => item.toLowerCase().includes(lower) && !(exclude || []).includes(item)
  );
}
