'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function NavLink({
  to,
  href,
  className,
  children,
  end = false,
  onClick,
  ...props
}) {
  const pathname = usePathname();
  const destination = href ?? to ?? '/';
  const isActive = end
    ? pathname === destination
    : pathname === destination || pathname.startsWith(`${destination}/`);

  const resolvedClassName =
    typeof className === 'function'
      ? className({ isActive, isPending: false })
      : cn(className, isActive && 'active');

  return (
    <NextLink
      href={destination}
      className={resolvedClassName}
      onClick={onClick}
      {...props}
    >
      {typeof children === 'function'
        ? children({ isActive, isPending: false })
        : children}
    </NextLink>
  );
}
