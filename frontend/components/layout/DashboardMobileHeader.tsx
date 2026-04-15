"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/utils/permissions";
import { ROUTES } from "@/config/constants";
import { isMessagingEnabled, isNotificationsEnabled } from "@/config/features";
import { cn } from "@/utils/helpers";
import {
	Menu,
	X,
	LayoutDashboard,
	FileText,
	Briefcase,
	Heart,
	CreditCard,
	MessageCircle,
	Bell,
	User,
	Settings,
	Search,
	ClipboardList,
	IndianRupee,
	Clock,
	Star,
	FolderOpen,
	Users,
	AlertTriangle,
	SlidersHorizontal,
	BarChart3,
	Shield,
	Tag,
	Scroll,
	MessagesSquare,
	LogOut,
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ElementType;
	permissions?: string[];
	roles?: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
	{ label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard, permissions: [Permission.DASHBOARD_VIEW] },
	{ label: "My Requests", href: ROUTES.DASHBOARD_REQUESTS, icon: FileText, permissions: [Permission.REQUESTS_CREATE, Permission.REQUESTS_READ], roles: ["customer"] },
	{ label: "My Jobs", href: ROUTES.DASHBOARD_JOBS, icon: Briefcase, permissions: [Permission.JOBS_READ], roles: ["customer", "provider"] },
	{ label: "Favorites", href: ROUTES.DASHBOARD_FAVORITES, icon: Heart, permissions: [Permission.FAVORITES_MANAGE], roles: ["customer"] },
	{ label: "Payment History", href: ROUTES.DASHBOARD_PAYMENT_HISTORY, icon: CreditCard, permissions: [Permission.PAYMENTS_READ], roles: ["customer"] },
	{ label: "My Reviews", href: ROUTES.DASHBOARD_REVIEWS, icon: Star, permissions: [Permission.REVIEWS_CREATE, Permission.REVIEWS_READ], roles: ["customer"] },
	{ label: "My Disputes", href: ROUTES.DASHBOARD_DISPUTES, icon: MessagesSquare, permissions: [Permission.DISPUTES_FILE, Permission.DISPUTES_READ], roles: ["customer", "provider"] },
	{ label: "Browse Requests", href: ROUTES.DASHBOARD_BROWSE_REQUESTS, icon: Search, permissions: [Permission.REQUESTS_BROWSE], roles: ["provider"] },
	{ label: "My Proposals", href: ROUTES.DASHBOARD_MY_PROPOSALS, icon: ClipboardList, permissions: [Permission.PROPOSALS_CREATE, Permission.PROPOSALS_READ], roles: ["provider"] },
	{ label: "Earnings", href: ROUTES.DASHBOARD_EARNINGS, icon: IndianRupee, permissions: [Permission.EARNINGS_VIEW], roles: ["provider"] },
	{ label: "Availability", href: ROUTES.DASHBOARD_AVAILABILITY, icon: Clock, permissions: [Permission.PROVIDER_AVAILABILITY_MANAGE], roles: ["provider"] },
	{ label: "My Profile", href: ROUTES.DASHBOARD_PROVIDER_OVERVIEW, icon: Star, permissions: [Permission.PROVIDER_PROFILE_VIEW], roles: ["provider"] },
	{ label: "Services", href: ROUTES.DASHBOARD_PROVIDER_SERVICES, icon: Tag, permissions: [Permission.PROVIDER_SERVICES_MANAGE], roles: ["provider"] },
	{ label: "Portfolio", href: ROUTES.DASHBOARD_PROVIDER_PORTFOLIO, icon: FolderOpen, permissions: [Permission.PROVIDER_PORTFOLIO_MANAGE], roles: ["provider"] },
	{ label: "Documents", href: ROUTES.DASHBOARD_PROVIDER_DOCUMENTS, icon: FileText, permissions: [Permission.PROVIDER_DOCUMENTS_MANAGE], roles: ["provider"] },
	{ label: "Reviews", href: ROUTES.DASHBOARD_PROVIDER_REVIEWS, icon: Star, permissions: [Permission.REVIEWS_READ], roles: ["provider"] },
	{ label: "Admin Overview", href: ROUTES.DASHBOARD_ADMIN, icon: LayoutDashboard, permissions: [Permission.ADMIN_ACCESS], roles: ["admin"] },
	{ label: "Users", href: ROUTES.DASHBOARD_ADMIN_USERS, icon: Users, permissions: [Permission.USERS_LIST], roles: ["admin"] },
	{ label: "Providers", href: ROUTES.DASHBOARD_ADMIN_PROVIDERS, icon: Shield, permissions: [Permission.PROVIDERS_LIST, Permission.PROVIDERS_VERIFY], roles: ["admin"] },
	{ label: "Categories", href: ROUTES.DASHBOARD_ADMIN_CATEGORIES, icon: Tag, permissions: [Permission.CATEGORIES_MANAGE], roles: ["admin"] },
	{ label: "Disputes", href: ROUTES.DASHBOARD_ADMIN_DISPUTES, icon: AlertTriangle, permissions: [Permission.DISPUTES_MANAGE], roles: ["admin"] },
	{ label: "Analytics", href: ROUTES.DASHBOARD_ADMIN_ANALYTICS, icon: BarChart3, permissions: [Permission.ANALYTICS_VIEW], roles: ["admin"] },
	{ label: "Audit Logs", href: ROUTES.DASHBOARD_ADMIN_AUDIT_LOGS, icon: Scroll, permissions: [Permission.AUDIT_VIEW], roles: ["admin"] },
	{ label: "Settings", href: ROUTES.DASHBOARD_ADMIN_SETTINGS, icon: SlidersHorizontal, permissions: [Permission.SETTINGS_MANAGE], roles: ["admin"] },
	{ label: "Roles & Permissions", href: ROUTES.DASHBOARD_ADMIN_ROLES, icon: Shield, permissions: [Permission.ROLES_MANAGE], roles: ["admin"] },
];

export function DashboardMobileHeader() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const { canAny } = usePermissions();
	const drawerRef = useRef<HTMLDivElement>(null);

	const role = user?.role ?? "customer";
	const userPermissions: string[] = (user as { permissions?: string[] })?.permissions ?? [];

	const navItems = ALL_NAV_ITEMS.filter((item) => {
		if (item.roles && !item.roles.includes(role)) return false;
		if (userPermissions.length > 0 && item.permissions) return canAny(item.permissions);
		if (item.roles) return item.roles.includes(role);
		return !item.permissions;
	});

	const bottomItems: NavItem[] = [
		...(isMessagingEnabled() ? [{ label: "Messages", href: ROUTES.DASHBOARD_MESSAGES, icon: MessageCircle }] : []),
		...(isNotificationsEnabled() ? [{ label: "Notifications", href: ROUTES.DASHBOARD_NOTIFICATIONS, icon: Bell }] : []),
		{ label: "Profile", href: ROUTES.DASHBOARD_PROFILE, icon: User },
		{ label: "Settings", href: ROUTES.DASHBOARD_SETTINGS, icon: Settings },
	];

	const isActive = (href: string) =>
		href === ROUTES.DASHBOARD ? pathname === "/dashboard" : pathname.startsWith(href);

	// Close drawer on route change
	useEffect(() => { setOpen(false); }, [pathname]);

	// Close drawer on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	// Prevent body scroll when drawer is open
	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	const initials = user?.name
		? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
		: user?.email?.[0]?.toUpperCase() ?? "U";

	return (
		<>
			{/* Top bar — only visible below lg */}
			<header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white dark:bg-gray-950 border-b border-gray-200/60 dark:border-gray-800/80 sticky top-0 z-40">
				{/* Logo */}
				<Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 group">
					<div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-sm">
						<span className="text-white font-bold text-xs select-none">LS</span>
					</div>
					<span className="text-sm font-bold text-gray-900 dark:text-gray-100">
						<span className="text-primary-600 dark:text-primary-400">Local</span>Service
					</span>
				</Link>

				{/* Right: avatar + hamburger */}
				<div className="flex items-center gap-2">
					<div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
						{initials}
					</div>
					<button
						onClick={() => setOpen(true)}
						aria-label="Open navigation menu"
						className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
						<Menu className="h-5 w-5" />
					</button>
				</div>
			</header>

			{/* Backdrop */}
			{open && (
				<div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
			)}

			{/* Drawer */}
			<div
				ref={drawerRef}
				className={cn(
					"lg:hidden fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-gray-950 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
					open ? "translate-x-0" : "-translate-x-full"
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Navigation menu">

				{/* Drawer header */}
				<div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800/80">
					<div className="flex items-center gap-2.5">
						<div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center">
							<span className="text-white font-bold text-xs">LS</span>
						</div>
						<span className="text-sm font-bold text-gray-900 dark:text-white">
							<span className="text-primary-600 dark:text-primary-400">Local</span>Service
						</span>
					</div>
					<button
						onClick={() => setOpen(false)}
						aria-label="Close navigation menu"
						className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* User info */}
				<div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
							{initials}
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
								{user?.name || "Account"}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
						</div>
					</div>
					<span className="inline-flex mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
						{role}
					</span>
				</div>

				{/* Nav items */}
				<nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
					{navItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
									active
										? "bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/20 text-primary-700 dark:text-primary-300"
										: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
								)}>
								<Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
								<span className="flex-1 truncate">{item.label}</span>
								{active && <span className="h-1.5 w-1.5 rounded-full bg-primary-500 dark:bg-primary-400 flex-shrink-0" />}
							</Link>
						);
					})}

					{/* Divider + account items */}
					<div className="pt-3 mt-3 border-t border-dashed border-gray-100 dark:border-gray-800/80 space-y-0.5">
						<p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
							Account
						</p>
						{bottomItems.map((item) => {
							const Icon = item.icon;
							const active = isActive(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
										active
											? "bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/20 text-primary-700 dark:text-primary-300"
											: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
									)}>
									<Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
									<span className="flex-1 truncate">{item.label}</span>
									{active && <span className="h-1.5 w-1.5 rounded-full bg-primary-500 dark:bg-primary-400 flex-shrink-0" />}
								</Link>
							);
						})}
					</div>
				</nav>

				{/* Logout */}
				<div className="px-3 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800/80">
					<button
						onClick={logout}
						className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
						<LogOut className="h-4 w-4 flex-shrink-0" />
						<span>Log out</span>
					</button>
				</div>
			</div>
		</>
	);
}
