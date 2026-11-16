// Only http(s) URLs are safe to render as a clickable href — anything
// else (javascript:, data:, etc.) executes on click if we render it
// verbatim. Every user-editable link field goes through this before
// becoming an <a href>.
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
