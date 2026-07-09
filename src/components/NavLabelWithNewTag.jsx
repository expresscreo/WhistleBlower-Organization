import { cn } from '@/lib/utils';

function NavNewTag({ className }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute rounded-[3px] bg-bounty-gold px-1 py-px text-[8px] font-bold leading-none tracking-[0.5px] text-black',
        className
      )}
      aria-hidden
    >
      NEW
    </span>
  );
}

export default function NavLabelWithNewTag({ name, showNewTag = false, tagClassName }) {
  if (!showNewTag) return name;

  const lastChar = name.slice(-1);
  const prefix = name.slice(0, -1);

  return (
    <>
      {prefix}
      <span className="relative inline-block">
        {lastChar}
        <NavNewTag
          className={cn(
            'left-full top-0 -translate-y-[calc(100%+2px)]',
            tagClassName
          )}
        />
      </span>
    </>
  );
}
