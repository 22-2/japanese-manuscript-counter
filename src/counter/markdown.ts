export function removeMarkdownSyntax(text: string): string {
  let cleaned = text;

  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, "");
  cleaned = cleaned.replace(/^\d+\.\s+/gm, "");
  cleaned = cleaned.replace(/^>\s+/gm, "");
  cleaned = cleaned.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, "");
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  return cleaned;
}
