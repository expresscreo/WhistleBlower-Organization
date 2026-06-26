import { cn } from '@/lib/utils';

const NavNotificationBadge = ({ count, className }) => {
  if (!count || count <= 0) return null;

  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      className={cn(
        'ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-primary-foreground',
        className
      )}
      aria-label={`${display} notifications`}
    >
      {display}
    </span>
  );
};

export default NavNotificationBadge;
