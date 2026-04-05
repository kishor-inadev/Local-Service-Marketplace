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
		return (
			<div className='w-full'>
				{label && (
					<label
						htmlFor={textareaId}
						className='block text-sm font-medium text-gray-700 mb-1'>
						{label}
						{props.required && <span className='text-red-500 ml-1'>*</span>}
					</label>
				)}
				<textarea
					ref={ref}
					id={textareaId}
					className={cn(
						"w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
						error && "border-red-500 focus:ring-red-500 focus:border-red-500",
						props.disabled && "bg-gray-100 cursor-not-allowed",
						className,
					)}
					rows={4}
					{...props}
				/>
				{error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
				{helperText && !error && <p className='mt-1 text-sm text-gray-500'>{helperText}</p>}
			</div>
		);
	},
);

Textarea.displayName = "Textarea";
