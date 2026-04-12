import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (_p: number) => void;
	showPageNumbers?: boolean;
	leftContent?: React.ReactNode;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	showPageNumbers = true,
	leftContent,
}: PaginationProps) {
	const hasNext = currentPage < totalPages;
	const hasPrevious = currentPage > 1;

	if (totalPages <= 1 && !leftContent) return null;

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) {
					pages.push(i);
				}
				pages.push("...");
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push("...");
				for (let i = totalPages - 3; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push("...");
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push("...");
				pages.push(totalPages);
			}
		}

		return pages;
	};

	return (
		<div className='mt-1 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6'>
			<div className='space-y-3 sm:hidden'>
				{leftContent && <div className='text-sm text-gray-700 dark:text-gray-300'>{leftContent}</div>}
				{totalPages > 1 && (
					<div className='flex flex-1 justify-between'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(currentPage - 1)}
							disabled={!hasPrevious}>
							Previous
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(currentPage + 1)}
							disabled={!hasNext}>
							Next
						</Button>
					</div>
				)}
			</div>

			<div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
				<div>
					{leftContent || (
						<p className='text-sm text-gray-700 dark:text-gray-300'>
							Page <span className='font-medium'>{currentPage}</span> of{" "}
							<span className='font-medium'>{totalPages}</span>
						</p>
					)}
				</div>

				{totalPages > 1 && (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(currentPage - 1)}
							disabled={!hasPrevious}>
							<ChevronLeft className='h-4 w-4' />
						</Button>

						{showPageNumbers &&
							getPageNumbers().map((page, index) =>
								page === "..." ?
									<span
										key={`ellipsis-${index}`}
										className='px-3 py-1 text-gray-500 dark:text-gray-400'>
										...
									</span>
								:	<button
										key={page}
										onClick={() => onPageChange(page as number)}
										className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
											currentPage === page ? "bg-primary-600 text-white" : (
												"text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
											)
										}`}>
										{page}
									</button>,
							)}

						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(currentPage + 1)}
							disabled={!hasNext}>
							<ChevronRight className='h-4 w-4' />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
