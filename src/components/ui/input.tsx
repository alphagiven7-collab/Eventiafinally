'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-earth"
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 bg-white border-2 rounded-xl text-primary',
            'placeholder:text-earth/50',
            'focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10',
            'transition-all duration-200',
            error 
              ? 'border-danger focus:border-danger focus:ring-danger/10' 
              : 'border-sand hover:border-sand/80',
            props.disabled && 'opacity-50 cursor-not-allowed bg-cream',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-earth/70">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
