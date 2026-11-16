// Builds a plain mailto: link — clicking it opens the user's own default
// mail app with the message pre-filled, ready to review and hit send.
// No server-side email config needed for this path.
export function buildMailto({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
