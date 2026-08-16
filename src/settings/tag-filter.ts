function normalizeTag(tag: string): string | null {
  const trimmed = tag.trim();
  if (!trimmed) return null;

  return `${trimmed.startsWith("#") ? trimmed : `#${trimmed}`}`.toLowerCase();
}

export function parseTagFilter(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,、\n]/)
        .map(normalizeTag)
        .filter((tag): tag is string => tag !== null),
    ),
  ];
}

export function matchesTagFilter(noteTags: readonly string[] | null, filterValue: string): boolean {
  const requiredTags = parseTagFilter(filterValue);
  if (requiredTags.length === 0) return true;
  if (!noteTags) return false;

  const normalizedNoteTags = new Set(
    noteTags.map(normalizeTag).filter((tag): tag is string => tag !== null),
  );

  return requiredTags.some((tag) => normalizedNoteTags.has(tag));
}
