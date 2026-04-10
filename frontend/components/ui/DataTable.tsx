import React, { useEffect, useMemo, useState } from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	OnChangeFn,
	SortingState,
	Table,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, LayoutGrid, List, Loader2, Search, SlidersHorizontal, Table2 } from "lucide-react";
import { Button } from "./Button";
import { Pagination } from "./Pagination";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableQuickSortOption {
	label: string;
	field: string;
	direction?: DataTableSortDirection;
}

export interface DataTableColumn<T> {
	id: string;
	header: string;
	sortable?: boolean;
	filterable?: boolean;
	align?: "left" | "center" | "right";
	className?: string;
	headerClassName?: string;
	accessor?: (row: T) => string | number | Date | null | undefined;
	cell: (row: T) => React.ReactNode;
}

export type DataTableProcessingMode = "client" | "server";

interface DataTableProps<T> {
	data: T[];
	columns: Array<DataTableColumn<T>>;
	getRowKey: (row: T, index: number) => string;
	processingMode?: DataTableProcessingMode;
	serverTotalRows?: number;
	serverPageIndex?: number;
	serverPageSize?: number;
	serverSearchTerm?: string;
	serverSorting?: SortingState;
	serverColumnFilters?: ColumnFiltersState;
	onServerPageIndexChange?: (pageIndex: number) => void;
	onServerPageSizeChange?: (pageSize: number) => void;
	onServerSearchChange?: (search: string) => void;
	onServerSortingChange?: (sorting: SortingState) => void;
	onServerColumnFiltersChange?: (filters: ColumnFiltersState) => void;
	initialSortField?: string;
	initialSortDirection?: DataTableSortDirection;
	quickSorts?: DataTableQuickSortOption[];
	quickSortLabel?: string;
	pageSizeOptions?: number[];
	defaultPageSize?: number;
	emptyMessage?: string;
	emptyActionLabel?: string;
	onEmptyAction?: () => void;
	showEmptyAction?: boolean;
	showPageSizeControl?: boolean;
	enableSearch?: boolean;
	searchPlaceholder?: string;
	searchDebounceMs?: number;
	searchableColumns?: string[];
	searchAccessor?: (row: T) => Array<string | number | Date | null | undefined>;
	toolbarFields?: React.ReactNode;
	isLoading?: boolean;
	loadingText?: string;
	renderToolbarFields?: (table: Table<T>) => React.ReactNode;
	enableExport?: boolean;
	exportLabel?: string;
	exportFileName?: string;
	onExport?: (rows: T[]) => void;
	exportCurrentPageOnly?: boolean;
	enableClearFilters?: boolean;
	clearFiltersLabel?: string;
	enableColumnVisibilityControl?: boolean;
	columnVisibilityLabel?: string;
	defaultPaginationMode?: "pagination" | "load-more";
	onLoadMore?: () => void;
}

export function DataTable<T>({
	data,
	columns,
	getRowKey,
	processingMode = "server",
	serverTotalRows,
	serverPageIndex,
	serverPageSize,
	serverSearchTerm,
	serverSorting,
	serverColumnFilters,
	onServerPageIndexChange,
	onServerPageSizeChange,
	onServerSearchChange,
	onServerSortingChange,
	onServerColumnFiltersChange,
	initialSortField,
	initialSortDirection = "desc",
	quickSorts = [],
	quickSortLabel = "Quick sort",
	pageSizeOptions = [10, 20, 50],
	defaultPageSize = 10,
	emptyMessage = "No records to display",
	emptyActionLabel = "Create New",
	onEmptyAction,
	showEmptyAction = true,
	showPageSizeControl = true,
	enableSearch = true,
	searchPlaceholder = "Search records",
	searchDebounceMs = 300,
	searchableColumns,
	searchAccessor,
	toolbarFields,
	isLoading = false,
	loadingText = "Updating results...",
	renderToolbarFields,
	enableExport = false,
	exportLabel = "Export",
	exportFileName = "table-data.csv",
	onExport,
	exportCurrentPageOnly = false,
	enableClearFilters = true,
	clearFiltersLabel = "Reset",
	enableColumnVisibilityControl = false,
	columnVisibilityLabel = "Columns",
	defaultPaginationMode = "pagination",
	onLoadMore,
}: DataTableProps<T>) {
	const [sorting, setSorting] = useState<SortingState>(
		initialSortField ? [{ id: initialSortField, desc: initialSortDirection === "desc" }] : [],
	);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [showColumnMenu, setShowColumnMenu] = useState(false);
	const [activePaginationMode, setActivePaginationMode] = useState<"pagination" | "load-more">(defaultPaginationMode);
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });
	const isServerMode = processingMode === "server";
	const activeSorting = isServerMode && serverSorting ? serverSorting : sorting;
	const activeColumnFilters = isServerMode && serverColumnFilters ? serverColumnFilters : columnFilters;
	const activePagination = {
		pageIndex: isServerMode && typeof serverPageIndex === "number" ? serverPageIndex : pagination.pageIndex,
		pageSize: isServerMode && typeof serverPageSize === "number" ? serverPageSize : pagination.pageSize,
	};
	const activeSearchTerm = isServerMode && typeof serverSearchTerm === "string" ? serverSearchTerm : searchTerm;

	const normalizedSearch = activeSearchTerm.trim().toLowerCase();

	const searchableFieldList = useMemo(
		() => (searchableColumns && searchableColumns.length > 0 ? searchableColumns : columns.map((column) => column.id)),
		[columns, searchableColumns],
	);

	const tableColumns = useMemo<ColumnDef<T>[]>(() => {
		return columns.map((column) => ({
			id: column.id,
			header: column.header,
			accessorFn: (row) => {
				if (column.accessor) {
					return column.accessor(row);
				}
				// Fallback to display_id if the column ID is "id" or "display_id"
				if (column.id === "id" || column.id === "display_id") {
					return (row as any).display_id || (row as any).id;
				}
				return (row as any)[column.id];
			},
			enableSorting: Boolean(column.sortable),
			enableColumnFilter: Boolean(column.filterable),
			cell: ({ row }) => column.cell(row.original),
			meta: { align: column.align, className: column.className, headerClassName: column.headerClassName },
		}));
	}, [columns]);

	const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
		const next = typeof updater === "function" ? updater(activeSorting) : updater;
		if (!isServerMode) {
			setSorting(next);
			return;
		}
		onServerSortingChange?.(next);
	};

	const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
		const next = typeof updater === "function" ? updater(activeColumnFilters) : updater;
		if (!isServerMode) {
			setColumnFilters(next);
			return;
		}
		onServerColumnFiltersChange?.(next);
	};

	const table = useReactTable({
		data,
		columns: tableColumns,
		state: {
			sorting: activeSorting,
			columnFilters: activeColumnFilters,
			globalFilter,
			pagination: activePagination,
			columnVisibility,
		},
		onSortingChange: handleSortingChange,
		onColumnFiltersChange: handleColumnFiltersChange,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: (updater) => {
			const next = typeof updater === "function" ? updater(activePagination) : updater;
			if (!isServerMode) {
				setPagination(next);
				return;
			}
			onServerPageIndexChange?.(next.pageIndex);
			onServerPageSizeChange?.(next.pageSize);
		},
		onColumnVisibilityChange: setColumnVisibility,
		manualPagination: isServerMode,
		manualSorting: isServerMode,
		manualFiltering: isServerMode,
		pageCount: Math.max(
			1,
			Math.ceil(
				(isServerMode ? (serverTotalRows ?? data.length) : data.length) / Math.max(1, activePagination.pageSize),
			),
		),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		globalFilterFn: (row) => {
			if (!enableSearch || !normalizedSearch) {
				return true;
			}

			const source = row.original;
			const values =
				searchAccessor ?
					searchAccessor(source)
				:	searchableFieldList.map((field) => {
						const definition = columns.find((column) => column.id === field);
						if (definition?.accessor) {
							return definition.accessor(source);
						}
						return (source as any)[field];
					});

			return values.some((value) =>
				String(value ?? "")
					.toLowerCase()
					.includes(normalizedSearch),
			);
		},
		autoResetPageIndex: false,
	});

	const sortIcon = (field: string) => {
		const activeSort = activeSorting.find((item) => item.id === field);
		if (!activeSort) {
			return <ArrowUpDown className='h-4 w-4 text-gray-400' />;
		}

		return activeSort.desc ?
				<ArrowDown className='h-4 w-4 text-primary-600 dark:text-primary-400' />
			:	<ArrowUp className='h-4 w-4 text-primary-600 dark:text-primary-400' />;
	};

	const onSearchChange = (value: string) => {
		setSearchInput(value);
	};

	useEffect(() => {
		setSearchInput(activeSearchTerm);
	}, [activeSearchTerm]);

	useEffect(() => {
		if (!enableSearch) {
			return;
		}

		const timer = setTimeout(
			() => {
				if (searchInput === activeSearchTerm) {
					return;
				}

				if (!isServerMode) {
					setSearchTerm(searchInput);
					setGlobalFilter(searchInput);
					table.setPageIndex(0);
					return;
				}

				onServerSearchChange?.(searchInput);
				onServerPageIndexChange?.(0);
			},
			Math.max(0, searchDebounceMs),
		);

		return () => clearTimeout(timer);
	}, [
		enableSearch,
		searchInput,
		activeSearchTerm,
		isServerMode,
		searchDebounceMs,
		onServerSearchChange,
		onServerPageIndexChange,
		table,
	]);

	const onPageSizeChange = (size: number) => {
		if (!isServerMode) {
			table.setPageSize(size);
			table.setPageIndex(0);
			return;
		}
		onServerPageSizeChange?.(size);
		onServerPageIndexChange?.(0);
	};

	const onQuickSortChange = (field: string) => {
		if (!field) {
			const resetSort = initialSortField ? [{ id: initialSortField, desc: initialSortDirection === "desc" }] : [];
			if (!isServerMode) {
				setSorting(resetSort);
			} else {
				onServerSortingChange?.(resetSort);
			}
			if (!isServerMode) {
				table.setPageIndex(0);
			} else {
				onServerPageIndexChange?.(0);
			}
			return;
		}

		const selected = quickSorts.find((item) => item.field === field);
		const nextSort = [{ id: field, desc: (selected?.direction || "asc") === "desc" }];
		if (!isServerMode) {
			setSorting(nextSort);
			table.setPageIndex(0);
			return;
		}
		onServerSortingChange?.(nextSort);
		onServerPageIndexChange?.(0);
	};

	const resetSorting = () => {
		if (initialSortField) {
			const resetSort = [{ id: initialSortField, desc: initialSortDirection === "desc" }];
			if (!isServerMode) {
				setSorting(resetSort);
				return;
			}
			onServerSortingChange?.(resetSort);
			return;
		}
		if (!isServerMode) {
			setSorting([]);
			return;
		}
		onServerSortingChange?.([]);
	};

	const handleResetTable = () => {
		setSearchInput("");
		if (!isServerMode) {
			setSearchTerm("");
		} else {
			onServerSearchChange?.("");
		}
		setGlobalFilter("");
		if (!isServerMode) {
			setColumnFilters([]);
		} else {
			onServerColumnFiltersChange?.([]);
		}
		resetSorting();
		if (!isServerMode) {
			table.setPageIndex(0);
		} else {
			onServerPageIndexChange?.(0);
		}
	};

	const rowsForExport = useMemo(() => {
		if (exportCurrentPageOnly) {
			return table.getRowModel().rows.map((row) => row.original);
		}
		if (isServerMode) {
			return data;
		}
		return table.getSortedRowModel().rows.map((row) => row.original);
	}, [table, exportCurrentPageOnly, isServerMode, data]);

	const visibleRows = table.getRowModel().rows;
	const totalRecords = isServerMode ? (serverTotalRows ?? data.length) : table.getFilteredRowModel().rows.length;
	const totalPages = Math.max(1, Math.ceil(totalRecords / Math.max(1, activePagination.pageSize)));
	const currentPage = activePagination.pageIndex + 1;
	const filteredCount = totalRecords;
	const pageIndex = activePagination.pageIndex;
	const pageSize = activePagination.pageSize;
	const startRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
	const endRow = filteredCount === 0 ? 0 : Math.min((pageIndex + 1) * pageSize, filteredCount);
	const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

	const toolbarFilterFields = renderToolbarFields ? renderToolbarFields(table) : toolbarFields;
	const activeQuickSortField = activeSorting[0]?.id || "";
	const defaultSortState: SortingState =
		initialSortField ? [{ id: initialSortField, desc: initialSortDirection === "desc" }] : [];
	const hasActiveFilters =
		(activeSearchTerm || searchInput).trim().length > 0 ||
		activeColumnFilters.length > 0 ||
		JSON.stringify(activeSorting) !== JSON.stringify(defaultSortState);
	const hideableColumns = table.getAllLeafColumns().filter((column) => column.id !== "action" && column.getCanHide());

	const convertRowsToCsv = (rows: T[]) => {
		const exportableColumns = columns.filter((column) => column.id !== "action");
		const headers = exportableColumns.map((column) => `"${String(column.header).replace(/"/g, '""')}"`);

		const body = rows.map((row) => {
			const values = exportableColumns.map((column) => {
				const rawValue = column.accessor ? column.accessor(row) : (row as any)[column.id];
				const safeValue = String(rawValue ?? "").replace(/"/g, '""');
				return `"${safeValue}"`;
			});
			return values.join(",");
		});

		return [headers.join(","), ...body].join("\n");
	};

	const downloadCsv = () => {
		const csvContent = convertRowsToCsv(rowsForExport);
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = exportFileName.endsWith(".csv") ? exportFileName : `${exportFileName}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleExport = () => {
		if (onExport) {
			onExport(rowsForExport);
			return;
		}
		downloadCsv();
	};

	const alignmentClass = (align?: "left" | "center" | "right") => {
		if (align === "center") return "text-center";
		if (align === "right") return "text-right";
		return "text-left";
	};

	return (
		<div className='space-y-4'>
			<div className='rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
				<div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex flex-wrap items-center gap-2'>
						{quickSorts.length > 0 && (
							<select
								value={activeQuickSortField}
								onChange={(e) => onQuickSortChange(e.target.value)}
								aria-label='Quick sort'
								className='h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-primary-900'>
								<option value=''>{quickSortLabel}</option>
								{quickSorts.map((sort) => (
									<option
										key={`${sort.field}:${sort.direction || "asc"}`}
										value={sort.field}>
										{sort.label}
									</option>
								))}
							</select>
						)}
					</div>

					<div className='ml-auto flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto'>
						{isLoading && (
							<span className='inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300'>
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
								{loadingText}
							</span>
						)}

						<div className='flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/50 p-1 dark:border-gray-700 dark:bg-gray-800/50'>
							<button
								type='button'
								onClick={() => setActivePaginationMode("pagination")}
								title='Pagination mode'
								className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
									activePaginationMode === "pagination"
										? "bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400"
										: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
								}`}>
								<LayoutGrid className='h-4 w-4' />
							</button>
							<button
								type='button'
								onClick={() => setActivePaginationMode("load-more")}
								title='Load more mode'
								className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
									activePaginationMode === "load-more"
										? "bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400"
										: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
								}`}>
								<List className='h-4 w-4' />
							</button>
						</div>
						{toolbarFilterFields}

						{enableClearFilters && hasActiveFilters && (
							<Button
								variant='outline'
								size='sm'
								onClick={handleResetTable}>
								{clearFiltersLabel}
							</Button>
						)}

						{enableColumnVisibilityControl && hideableColumns.length > 0 && (
							<div className='relative'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setShowColumnMenu((prev) => !prev)}>
									<SlidersHorizontal className='mr-2 h-4 w-4' />
									{columnVisibilityLabel}
								</Button>

								{showColumnMenu && (
									<div className='absolute right-0 z-20 mt-2 w-52 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900'>
										<div className='mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'>
											Visible columns
										</div>
										<div className='space-y-1'>
											{hideableColumns.map((column) => (
												<label
													key={column.id}
													className='flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'>
													<input
														type='checkbox'
														checked={column.getIsVisible()}
														onChange={column.getToggleVisibilityHandler()}
														className='h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500'
													/>
													<span>{String(column.columnDef.header ?? column.id)}</span>
												</label>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{enableExport && (
							<Button
								variant='outline'
								size='sm'
								onClick={handleExport}>
								<Download className='mr-2 h-4 w-4' />
								{exportLabel}
							</Button>
						)}

						{enableSearch && (
							<div className='relative min-w-[260px]'>
								<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
								<input
									type='text'
									value={searchInput}
									onChange={(e) => onSearchChange(e.target.value)}
									placeholder={searchPlaceholder}
									aria-label='Search records'
									className='h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-primary-900'
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			{visibleRows.length > 0 ?
				<>
					<div className='overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900'>
						<table className='w-full'>
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr
										key={headerGroup.id}
										className='border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/50'>
										{headerGroup.headers.map((header) => {
											const columnMeta = header.column.columnDef.meta as
												| { align?: "left" | "center" | "right"; headerClassName?: string }
												| undefined;
											const isSortable = header.column.getCanSort();

											return (
												<th
													key={header.id}
													className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 ${alignmentClass(columnMeta?.align)} ${columnMeta?.headerClassName || ""}`}>
													{isSortable ?
														<button
															type='button'
															onClick={header.column.getToggleSortingHandler()}
															className={`inline-flex items-center gap-1 rounded-sm transition-colors hover:text-gray-900 dark:hover:text-white ${columnMeta?.align === "right" ? "justify-end" : ""}`}>
															{flexRender(header.column.columnDef.header, header.getContext())}
															{sortIcon(header.column.id)}
														</button>
													:	flexRender(header.column.columnDef.header, header.getContext())}
												</th>
											);
										})}
									</tr>
								))}
							</thead>
							<tbody>
								{visibleRows.map((row, rowIndex) => (
									<tr
										key={getRowKey(row.original, rowIndex)}
										className='border-b border-gray-100 transition-colors odd:bg-white even:bg-gray-50/30 hover:bg-gray-50 dark:border-gray-800 dark:odd:bg-gray-900 dark:even:bg-gray-900 dark:hover:bg-gray-800/70'>
										{row.getVisibleCells().map((cell) => {
											const columnMeta = cell.column.columnDef.meta as
												| { align?: "left" | "center" | "right"; className?: string }
												| undefined;

											return (
												<td
													key={cell.id}
													className={`px-4 py-3.5 text-sm text-gray-800 dark:text-gray-100 ${alignmentClass(columnMeta?.align)} ${columnMeta?.className || ""}`}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{activePaginationMode === "pagination" ?
						<Pagination
							currentPage={currentPage}
							totalPages={Math.max(1, totalPages)}
							onPageChange={(nextPage) => {
								if (!isServerMode) {
									table.setPageIndex(Math.max(0, nextPage - 1));
									return;
								}
								onServerPageIndexChange?.(Math.max(0, nextPage - 1));
							}}
							leftContent={
								<div className='flex flex-wrap items-center gap-3'>
									<div className='text-sm text-gray-600 dark:text-gray-300'>
										Showing {numberFormatter.format(startRow)}-{numberFormatter.format(endRow)} of{" "}
										{numberFormatter.format(filteredCount)} records
									</div>

									{showPageSizeControl && (
										<select
											value={pageSize}
											onChange={(e) => onPageSizeChange(Number(e.target.value))}
											aria-label='Rows per page'
											className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-primary-900'>
											{pageSizeOptions.map((size) => (
												<option
													key={size}
													value={size}>
													{size} per page
												</option>
											))}
										</select>
									)}
								</div>
							}
						/>
					:	<div className='flex flex-col items-center justify-center gap-3 py-2'>
							{currentPage < totalPages && (
								<Button
									variant='outline'
									className='min-w-[200px] border-gray-200 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
									onClick={() => {
										if (!isServerMode) {
											table.setPageIndex(pageIndex + 1);
										} else {
											onServerPageIndexChange?.(pageIndex + 1);
										}
										onLoadMore?.();
									}}
									disabled={isLoading}>
									{isLoading ?
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Loading...
										</>
									:	"Load More Results"}
								</Button>
							)}
							<div className='text-xs text-gray-500 dark:text-gray-400'>
								Showing {numberFormatter.format(endRow)} of {numberFormatter.format(filteredCount)} records
							</div>
						</div>
					}
				</>
			:	<div className='rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900/40'>
					<div className='mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800'>
						<Table2 className='h-5 w-5 text-gray-400' />
					</div>
					<p className='text-sm font-medium text-gray-700 dark:text-gray-200'>{emptyMessage}</p>
					<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>Try adjusting your filters or search.</p>
					{onEmptyAction && showEmptyAction && (
						<div className='mt-4'>
							<Button
								variant='primary'
								size='sm'
								onClick={onEmptyAction}>
								{emptyActionLabel}
							</Button>
						</div>
					)}
				</div>
			}
		</div>
	);
}
