import React, { forwardRef, useId } from "react";
import { cn } from "@/utils/helpers";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, helperText, className, ...props }, ref) => {
		const generatedId = useId();
		const inputId = props.id || generatedId;
		const errorId = `${inputId}-error`;
		const helperId = `${inputId}-helper`;
		return (
			<div className='w-full'>
				{label && (
					<label
						htmlFor={inputId}
						className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
						{label}
						{props.required && <span className='text-red-500 ml-1'>*</span>}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					suppressHydrationWarning
					aria-invalid={error ? "true" : undefined}
					aria-describedby={
						error ? errorId
						: helperText ?
							helperId
						:	undefined
					}
					className={cn(
				"w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:focus:border-primary-400 transition-colors duration-150",
				error && "border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500",
					props.disabled && "bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60",
						className,
					)}
					{...props}
				/>
				{error && (
					<p
						id={errorId}
						role='alert'
						className='mt-1 text-sm text-red-600 dark:text-red-400'>
						{error}
					</p>
				)}
				{helperText && !error && (
					<p
						id={helperId}
						className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";
