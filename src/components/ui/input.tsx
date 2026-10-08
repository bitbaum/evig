'use client';

import { ComponentProps, forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { designPrimitive } from '@/lib/design-system';
import { DateInput } from '@/components/ui/date-input';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** `elevated` lifts the dark-mode bg for use inside Modal/aside/toolbar containers. */
  variant?: 'default' | 'elevated';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const classes = cn(
      variant === 'elevated' ? designPrimitive.form.inputElevated : designPrimitive.form.input,
      className,
    );
    // A date is picked, not typed: the value reads in words ("Sa., 11. Okt.
    // 2026 · 14:00") in this same control styling, and the platform picker
    // still opens on tap (@bitbaum/whenkit). Every date field in evig goes
    // through here, so one branch replaces the browser's bare "tt.mm.jjjj".
    if (props.type === 'date' || props.type === 'datetime-local') {
      return (
        <DateInput
          {...(props as ComponentProps<typeof DateInput>)}
          type={props.type as 'date' | 'datetime-local'}
          className={classes}
          ref={ref}
        />
      );
    }
    return <input className={classes} ref={ref} {...props} />;
  },
);

Input.displayName = 'Input';

export { Input };
