import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';
import { cn } from '@/lib/utils';

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
            {toasts.map(({ id, title, description, action, variant, dismiss: _dismiss, update: _update, ...props }) => {
				return (
					<Toast key={id} {...props} variant={variant} className={cn({
            "bg-[#72E3AD]/65 backdrop-blur-sm border-[#36C182] text-black shadow-none": variant !== 'destructive',
            "dark:bg-[#72E3AD]/65 dark:backdrop-blur-sm dark:border-[#36C182] dark:text-black dark:shadow-none": variant !== 'destructive'
          })}>
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose className="text-black hover:text-black/80 dark:text-black dark:hover:text-black/80" />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}