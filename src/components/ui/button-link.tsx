import * as React from "react";
import Link from "next/link";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

interface ButtonLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Opens in a new tab (used for the Cal.com booking link). */
  external?: boolean;
}

/**
 * A link that looks like a button. Use this instead of wrapping a <Button> in
 * a <Link>, which nests a button inside a link (invalid HTML, bad for keyboards).
 *
 * It shares `buttonVariants` with <Button>, so it gets the same dark-glass look,
 * the same 44px touch height and the same press feedback. `draggable={false}`
 * stops the long-press "drag preview" on iOS and the ghost-drag on desktop.
 */
export function ButtonLink({
  href,
  variant,
  size,
  external,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const classes = buttonVariants({ variant, size, className });
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        className={classes}
        {...props}
      >
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} draggable={false} className={classes} {...props}>
      {children}
    </Link>
  );
}
