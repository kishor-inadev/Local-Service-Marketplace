import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(amount);
}

export function parseRating(value: number | string | null | undefined): number | undefined {
	if (value === null || value === undefined || value === "") {
		return undefined;
	}

	const rating = typeof value === "string" ? Number(value) : value;
	return typeof rating === "number" && !Number.isNaN(rating) ? rating : undefined;
}

export function formatDate(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(d);
}

export function formatDateTime(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
}

export function formatRelativeTime(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return "Just now";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : "" } ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours > 1 ? "s" : "" } ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays} day${diffInDays > 1 ? "s" : "" } ago`;
	}

	return formatDate(d);
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + "...";
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function kebabToTitle(str: string): string {
	return str
		.split("-")
		.map((word) => capitalize(word))
		.join(" ");
}

export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.substring(0, 2);
}

export function generateId(): string {
	return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export function validateEmail(email: string): boolean {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

export function validatePhone(phone: string): boolean {
	// Removed useless escapes for ( ) and - inside square brackets
	const re = /^\+?[\d\s-()]+$/;
	return re.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

export function getStatusColor(status: string): "blue" | "green" | "yellow" | "red" | "gray" {
	const statusColors: Record<string, any> = {
		open: "blue",
		pending: "yellow",
		in_progress: "blue",
		scheduled: "blue",
		accepted: "green",
		completed: "green",
		cancelled: "red",
		rejected: "red",
		failed: "red",
		disputed: "red",
		processing: "yellow",
		active: "green",
		suspended: "red",
	};
	return statusColors[status] || "gray";
}

export function getStatusLabel(status: string): string {
	return status
		.split("_")
		.map((word) => capitalize(word))
		.join(" ");
}
