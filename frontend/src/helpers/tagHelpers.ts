export function addTag(selectedTags: string[], tag: string): string[] {
  if (tag && !selectedTags.includes(tag)) {
    return [...selectedTags, tag];
  }
  return selectedTags;
}

export function removeTag(selectedTags: string[], tag: string): string[] {
  return selectedTags.filter((t) => t !== tag);
}
