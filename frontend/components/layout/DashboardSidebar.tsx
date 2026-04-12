"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/utils/permissions";
import { ROUTES } from "@/config/constants";
import { isMessagingEnabled, isNotificationsEnabled } from "@/config/features";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/utils/helpers";
import { Tooltip } from "@/components/ui/Tooltip";
import {
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
	DollarSign,
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
	PanelLeftClose,
	PanelLeftOpen,
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ElementType;
	/** If set, user must have at least one of these permissions to see this item */
	permissions?: string[];
	/** Legacy: if set and no user permissions exist, fallback to role check */
	roles?: string[];
}

/**
 * All possible nav items. Visibility is controlled by `permissions` (preferred)
 * or `roles` (fallback for tokens without permissions).
 * Items without permissions/roles are visible to all authenticated users.
 */
const ALL_NAV_ITEMS: NavItem[] = [
	// ── Customer items ─────────────────────────────────────────────────────
	{ label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard, permissions: [Permission.DASHBOARD_VIEW] },
	{ label: "My Requests", href: ROUTES.DASHBOARD_REQUESTS, icon: FileText, permissions: [Permission.REQUESTS_CREATE, Permission.REQUESTS_READ], roles: ["customer"] },
	{ label: "My Jobs", href: ROUTES.DASHBOARD_JOBS, icon: Briefcase, permissions: [Permission.JOBS_READ], roles: ["customer", "provider"] },
	{ label: "Favorites", href: ROUTES.DASHBOARD_FAVORITES, icon: Heart, permissions: [Permission.FAVORITES_MANAGE], roles: ["customer"] },
	{ label: "Payment History", href: ROUTES.DASHBOARD_PAYMENT_HISTORY, icon: CreditCard, permissions: [Permission.PAYMENTS_READ], roles: ["customer"] },
	{ label: "My Reviews", href: ROUTES.DASHBOARD_REVIEWS, icon: Star, permissions: [Permission.REVIEWS_CREATE, Permission.REVIEWS_READ], roles: ["customer"] },
	{ label: "My Disputes", href: ROUTES.DASHBOARD_DISPUTES, icon: MessagesSquare, permissions: [Permission.DISPUTES_FILE, Permission.DISPUTES_READ], roles: ["customer", "provider"] },

	// ── Provider items ─────────────────────────────────────────────────────
	{ label: "Browse Requests", href: ROUTES.DASHBOARD_BROWSE_REQUESTS, icon: Search, permissions: [Permission.REQUESTS_BROWSE], roles: ["provider"] },
	{ label: "My Proposals", href: ROUTES.DASHBOARD_MY_PROPOSALS, icon: ClipboardList, permissions: [Permission.PROPOSALS_CREATE, Permission.PROPOSALS_READ], roles: ["provider"] },
	{ label: "Earnings", href: ROUTES.DASHBOARD_EARNINGS, icon: DollarSign, permissions: [Permission.EARNINGS_VIEW], roles: ["provider"] },
	{ label: "Availability", href: ROUTES.DASHBOARD_AVAILABILITY, icon: Clock, permissions: [Permission.PROVIDER_AVAILABILITY_MANAGE], roles: ["provider"] },
	{ label: "My Profile", href: ROUTES.DASHBOARD_PROVIDER_OVERVIEW, icon: Star, permissions: [Permission.PROVIDER_PROFILE_VIEW], roles: ["provider"] },
	{ label: "Services", href: ROUTES.DASHBOARD_PROVIDER_SERVICES, icon: Tag, permissions: [Permission.PROVIDER_SERVICES_MANAGE], roles: ["provider"] },
	{ label: "Portfolio", href: ROUTES.DASHBOARD_PROVIDER_PORTFOLIO, icon: FolderOpen, permissions: [Permission.PROVIDER_PORTFOLIO_MANAGE], roles: ["provider"] },
	{ label: "Documents", href: ROUTES.DASHBOARD_PROVIDER_DOCUMENTS, icon: FileText, permissions: [Permission.PROVIDER_DOCUMENTS_MANAGE], roles: ["provider"] },
	{ label: "Reviews", href: ROUTES.DASHBOARD_PROVIDER_REVIEWS, icon: Star, permissions: [Permission.REVIEWS_READ], roles: ["provider"] },

	// ── Admin items ────────────────────────────────────────────────────────
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

const sharedBottomLinks = (messaging: boolean, notifications: boolean): NavItem[] => {
	const links: NavItem[] = [];
	if (messaging) links.push({ label: "Messages", href: ROUTES.DASHBOARD_MESSAGES, icon: MessageCircle });
	if (notifications) links.push({ label: "Notifications", href: ROUTES.DASHBOARD_NOTIFICATIONS, icon: Bell });
	links.push(
		{ label: "Profile", href: ROUTES.DASHBOARD_PROFILE, icon: User },
		{ label: "Settings", href: ROUTES.DASHBOARD_SETTINGS, icon: Settings },
	);
	return links;
};

function NavLink({ item, isActive, isCollapsed }: { item: NavItem; isActive: boolean; isCollapsed: boolean }) {
	const Icon = item.icon;

	const content = (
		<Link
			href={item.href}
			className={cn(
				"group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
				isActive ?
					"bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/20 text-primary-700 dark:text-primary-300 shadow-sm"
				:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200",
				isCollapsed && "justify-center px-2.5"
			)}>
			<Icon className={cn('h-4 w-4 flex-shrink-0 transition-colors', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300')} />
			{!isCollapsed && (
				<>
					<span className='flex-1 min-w-0 truncate'>{item.label}</span>
					{isActive && <span className='h-1.5 w-1.5 rounded-full bg-primary-500 dark:bg-primary-400 flex-shrink-0' />}
				</>
			)}
		</Link>
	);

	if (isCollapsed) {
		return (
			<Tooltip content={item.label} position="right">
				{content}
			</Tooltip>
		);
	}

	return content;
}

export function DashboardSidebar() {
	const pathname = usePathname();
	const { user } = useAuth();
	const { canAny } = usePermissions();
	const { isCollapsed, toggleSidebar } = useSidebarStore();

	const role = user?.role ?? "customer";
	const userPermissions: string[] = (user as { permissions?: string[] })?.permissions ?? [];

	const mainLinks = ALL_NAV_ITEMS.filter((item) => {
		// Permission-based filtering (preferred)
		if (userPermissions.length > 0 && item.permissions) {
			return canAny(item.permissions);
		}
		// Fallback: role-based filtering for tokens without permissions
		if (item.roles) {
			return item.roles.includes(role);
		}
		// Items with no permissions/roles restriction are always visible
		return !item.permissions;
	});

	const bottomLinks = sharedBottomLinks(isMessagingEnabled(), isNotificationsEnabled());

	const isActive = (href: string) => {
		if (href === ROUTES.DASHBOARD) return pathname === "/dashboard";
		return pathname.startsWith(href);
	};

	return (
		<aside
			className={cn(
				"flex-shrink-0 hidden lg:flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800/80 h-screen sticky top-0 transition-all duration-300 ease-in-out",
				isCollapsed ? "w-[72px]" : "w-64"
			)}>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800/80'>
				{!isCollapsed && (
					<div className='flex items-center gap-2.5'>
						<div className='h-7 w-7 rounded-lg bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center'>
							<span className='text-white font-bold text-xs'>LS</span>
						</div>
						<span className='text-sm font-bold text-gray-900 dark:text-white'>
							<span className='text-primary-600 dark:text-primary-400'>Local</span>Service
						</span>
					</div>
				)}
				<button
					onClick={toggleSidebar}
					className={cn(
						"p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
						isCollapsed && "mx-auto"
					)}
					title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
					{isCollapsed ?
						<PanelLeftOpen className='h-4 w-4' />
					:	<PanelLeftClose className='h-4 w-4' />}
				</button>
			</div>

			{/* Role chip */}
			{!isCollapsed && (
				<div className='px-4 py-2.5 border-b border-gray-100 dark:border-gray-800/80'>
					<span className='inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'>
						{role}
					</span>
				</div>
			)}

			<div className='flex-1 py-3 px-3 overflow-y-auto'>
				<nav className='space-y-0.5'>
					{mainLinks.map((item) => (
						<NavLink
							key={item.href}
							item={item}
							isActive={isActive(item.href)}
							isCollapsed={isCollapsed}
						/>
					))}
				</nav>

				<div className='mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800/80'>
					{!isCollapsed && (
						<p className='px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest'>Account</p>
					)}
					<nav className='space-y-0.5'>
						{bottomLinks.map((item) => (
							<NavLink
								key={item.href}
								item={item}
								isActive={isActive(item.href)}
								isCollapsed={isCollapsed}
							/>
						))}
					</nav>
				</div>
			</div>
		</aside>
	);
}
