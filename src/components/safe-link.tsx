import { cn } from "@/lib/utils";
import { isSafeHttpUrl } from "@/lib/url-safety";

// Renders an <a> only for http(s) URLs. Anything else (a stray
// javascript: URL saved into a link field, a malformed value) renders as
// plain, non-clickable text instead of executing on click.
export function SafeLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isSafeHttpUrl(href)) {
    return (
      <span
        className={cn("text-muted-foreground", className)}
        title="Not a valid http(s) link"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
