import React, { forwardRef, useId } from "react";
import { cn } from "@/utils/helpers";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ label, error, options, className, ...props }, ref) => {
		const generatedId = useId();
		const selectId = props.id || generatedId;
		const errorId = `${selectId}-error`;
		return (
			<div className='w-full'>
				{label && (
					<label
						htmlFor={selectId}
						className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
						{label}
						{props.required && <span className='text-red-500 ml-1'>*</span>}
					</label>
				)}
				<select
					ref={ref}
					id={selectId}
					aria-invalid={error ? "true" : undefined}
					aria-describedby={error ? errorId : undefined}
					className={cn(
						"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
						error && "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500",
						props.disabled && "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60",
						className,
					)}
					{...props}>
					<option value=''>Select an option</option>
					{options.map((option) => (
						<option
							key={option.value}
							value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{error && (
					<p
						id={errorId}
						role='alert'
						className='mt-1 text-sm text-red-600 dark:text-red-400'>
						{error}
					</p>
				)}
			</div>
		);
	},
);

Select.displayName = "Select";
