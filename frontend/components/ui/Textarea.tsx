import React, { forwardRef, useId } from "react";
import { cn } from "@/utils/helpers";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ label, error, helperText, className, ...props }, ref) => {
		const generatedId = useId();
		const textareaId = props.id || generatedId;
		const errorId = `${textareaId}-error`;
		const helperId = `${textareaId}-helper`;
		return (
			<div className='w-full'>
				{label && (
					<label
						htmlFor={textareaId}
						className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
						{label}
						{props.required && <span className='text-red-500 ml-1'>*</span>}
					</label>
				)}
				<textarea
					ref={ref}
					id={textareaId}
					aria-invalid={error ? "true" : undefined}
					aria-describedby={
						error ? errorId
						: helperText ?
							helperId
						:	undefined
					}
					className={cn(
						"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
						error && "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500",
						props.disabled && "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60",
						className,
					)}
					rows={4}
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

Textarea.displayName = "Textarea";
