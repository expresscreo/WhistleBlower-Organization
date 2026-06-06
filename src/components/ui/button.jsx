import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';
import { LoadingDots } from '@/components/ui/loading-dots';

const buttonVariants = cva(
	'inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3',
				lg: 'h-11 px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const loadingDotClassByVariant = {
	default: 'text-white/90',
	destructive: 'text-white/90',
	secondary: 'text-secondary-foreground',
	outline: 'text-foreground',
	ghost: 'text-foreground',
	link: 'text-primary',
};

const Button = React.forwardRef(({
	className,
	variant,
	size,
	asChild = false,
	loading = false,
	loadingClassName,
	disabled,
	children,
	...props
}, ref) => {
	const Comp = asChild && !loading ? Slot : 'button';

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }), loading && 'cursor-wait')}
			ref={ref}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			{...props}
		>
			{loading ? (
				<span className="inline-flex min-h-[1.25em] items-center justify-center">
					<LoadingDots className={cn(loadingDotClassByVariant[variant ?? 'default'], loadingClassName)} />
				</span>
			) : (
				children
			)}
		</Comp>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };
