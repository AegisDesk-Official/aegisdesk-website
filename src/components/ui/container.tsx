import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

/**
 * Container primitive per DESIGN.md:
 * - Max width: 1200px
 * - Side padding: 24px mobile (px-6), 48px desktop (md:px-12)
 * - Centered (mx-auto)
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, as: Component = "div", children, ...props }, ref) => {
    return React.createElement(
      Component,
      {
        ref,
        className: cn("mx-auto w-full max-w-[1200px] px-6 md:px-12", className),
        ...props,
      },
      children
    );
  }
);
Container.displayName = "Container";

export default Container;
