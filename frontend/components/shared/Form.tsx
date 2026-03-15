'use client';

import React from 'react';
import { useForm, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';

interface FormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  schema?: ZodType<T>;
  defaultValues?: Partial<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  className?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export function Form<T extends FieldValues>({
  onSubmit,
  schema,
  defaultValues,
  children,
  className,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  showActions = true,
}: FormProps<T>) {
  const methods = useForm<T>({
    // @ts-ignore - Zod schema type compatibility
    resolver: schema ? zodResolver(schema) : undefined,
    // @ts-ignore - defaultValues type compatibility
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const loading = isLoading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit as any)}
      className={cn('space-y-6', className)}
    >
      {children(methods as unknown as UseFormReturn<T>)}
      
      {showActions && (
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
          >
            {submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

// Field wrapper for consistent styling
interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
