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
	ChevronRight,
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
				"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
				isActive ?
					"bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
				:	"text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
				isCollapsed && "justify-center px-2"
			)}>
			<Icon className='h-5 w-5 flex-shrink-0' />
			{!isCollapsed && (
				<>
					<span className='flex-1 min-w-0 truncate'>{item.label}</span>
					{isActive && <ChevronRight className='h-3 w-3 flex-shrink-0 opacity-60' />}
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
				"flex-shrink-0 hidden lg:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen transition-all duration-300 ease-in-out",
				isCollapsed ? "w-20" : "w-64"
			)}>
			<div className='flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700'>
				{!isCollapsed && (
					<span className='text-sm font-bold text-gray-900 dark:text-white truncate'>
						Menu
					</span>
				)}
				<button
					onClick={toggleSidebar}
					className={cn(
						"p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors",
						isCollapsed && "mx-auto"
					)}
					title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
					{isCollapsed ?
						<PanelLeftOpen className='h-5 w-5' />
					:	<PanelLeftClose className='h-5 w-5' />}
				</button>
			</div>

			<div className='flex-1 py-4 px-3 overflow-y-auto'>
				<nav className='space-y-1'>
					{mainLinks.map((item) => (
						<NavLink
							key={item.href}
							item={item}
							isActive={isActive(item.href)}
							isCollapsed={isCollapsed}
						/>
					))}
				</nav>

				<div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
					<nav className='space-y-1'>
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
