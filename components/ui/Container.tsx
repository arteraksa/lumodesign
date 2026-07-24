import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Container<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...props
}: Props<T>) {
  return createElement(as ?? "div", { ...props, className: `container ${className}` }, children);
}
