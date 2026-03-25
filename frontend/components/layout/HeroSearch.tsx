"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HeroSearch() {
	const router = useRouter();
	const [query, setQuery] = useState("");

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const q = query.trim();
		if (q) {
			router.push(`/requests/create?q=${encodeURIComponent(q)}`);
		} else {
			router.push("/requests/create");
		}
	};

	return (
		<form
			onSubmit={handleSearch}
			className='mt-12 max-w-3xl mx-auto'>
			<div className='relative'>
				<div className='absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none'>
					<Search className='h-5 w-5 text-gray-400 dark:text-gray-500' />
				</div>
				<input
					type='text'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder='What service do you need? (e.g., plumbing, house cleaning, electrician)'
					className='w-full pl-14 pr-36 py-5 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 shadow-lg transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
				/>
				<Button
					type='submit'
					className='absolute right-2 top-2 bottom-2 rounded-xl px-6 font-semibold'>
					Search
				</Button>
			</div>
			<p className='mt-3 text-sm text-gray-500 dark:text-gray-400 text-center'>
				Popular:&nbsp;
				{["House Cleaning", "Plumbing", "Moving", "Electrical", "Landscaping"].map((term, i, arr) => (
					<button
						key={term}
						type='button'
						onClick={() => router.push(`/requests/create?q=${encodeURIComponent(term)}`)}
						className='hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors'>
						{term}
						{i < arr.length - 1 ? " • " : ""}
					</button>
				))}
			</p>
		</form>
	);
}
