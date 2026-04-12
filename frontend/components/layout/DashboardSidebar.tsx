"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
}

const customerLinks: NavItem[] = [
	{ label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
	{ label: "My Requests", href: ROUTES.DASHBOARD_REQUESTS, icon: FileText },
	{ label: "My Jobs", href: ROUTES.DASHBOARD_JOBS, icon: Briefcase },
	{ label: "Favorites", href: ROUTES.DASHBOARD_FAVORITES, icon: Heart },
	{ label: "Payment History", href: ROUTES.DASHBOARD_PAYMENT_HISTORY, icon: CreditCard },
	{ label: "My Reviews", href: ROUTES.DASHBOARD_REVIEWS, icon: Star },
	{ label: "My Disputes", href: ROUTES.DASHBOARD_DISPUTES, icon: MessagesSquare },
];

const providerLinks: NavItem[] = [
	{ label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
	{ label: "Browse Requests", href: ROUTES.DASHBOARD_BROWSE_REQUESTS, icon: Search },
	{ label: "My Proposals", href: ROUTES.DASHBOARD_MY_PROPOSALS, icon: ClipboardList },
	{ label: "My Jobs", href: ROUTES.DASHBOARD_JOBS, icon: Briefcase },
	{ label: "Earnings", href: ROUTES.DASHBOARD_EARNINGS, icon: DollarSign },
	{ label: "Availability", href: ROUTES.DASHBOARD_AVAILABILITY, icon: Clock },
	{ label: "My Profile", href: ROUTES.DASHBOARD_PROVIDER_OVERVIEW, icon: Star },
	{ label: "Services", href: ROUTES.DASHBOARD_PROVIDER_SERVICES, icon: Tag },
	{ label: "Portfolio", href: ROUTES.DASHBOARD_PROVIDER_PORTFOLIO, icon: FolderOpen },
	{ label: "Documents", href: ROUTES.DASHBOARD_PROVIDER_DOCUMENTS, icon: FileText },
	{ label: "Reviews", href: ROUTES.DASHBOARD_PROVIDER_REVIEWS, icon: Star },
	{ label: "My Disputes", href: ROUTES.DASHBOARD_DISPUTES, icon: MessagesSquare },
];

const adminLinks: NavItem[] = [
	{ label: "Admin Overview", href: ROUTES.DASHBOARD_ADMIN, icon: LayoutDashboard },
	{ label: "Users", href: ROUTES.DASHBOARD_ADMIN_USERS, icon: Users },
	{ label: "Providers", href: ROUTES.DASHBOARD_ADMIN_PROVIDERS, icon: Shield },
	{ label: "Categories", href: ROUTES.DASHBOARD_ADMIN_CATEGORIES, icon: Tag },
	{ label: "Disputes", href: ROUTES.DASHBOARD_ADMIN_DISPUTES, icon: AlertTriangle },
	{ label: "Analytics", href: ROUTES.DASHBOARD_ADMIN_ANALYTICS, icon: BarChart3 },
	{ label: "Audit Logs", href: ROUTES.DASHBOARD_ADMIN_AUDIT_LOGS, icon: Scroll },
	{ label: "Settings", href: ROUTES.DASHBOARD_ADMIN_SETTINGS, icon: SlidersHorizontal },
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
	const { isCollapsed, toggleSidebar } = useSidebarStore();

	const role = user?.role ?? "customer";

	const mainLinks =
		role === "admin" ? adminLinks
		: role === "provider" ? providerLinks
		: customerLinks;

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
