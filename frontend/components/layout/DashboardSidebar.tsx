"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/constants";
import { isMessagingEnabled, isNotificationsEnabled } from "@/config/features";
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
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ElementType;
}

const customerLinks: NavItem[] = [
	{ label: "Dashboard", href: ROUTES.DASHBOARD_CUSTOMER, icon: LayoutDashboard },
	{ label: "My Requests", href: ROUTES.DASHBOARD_REQUESTS, icon: FileText },
	{ label: "My Jobs", href: ROUTES.DASHBOARD_JOBS, icon: Briefcase },
	{ label: "Favorites", href: ROUTES.DASHBOARD_FAVORITES, icon: Heart },
	{ label: "Payment History", href: ROUTES.DASHBOARD_PAYMENT_HISTORY, icon: CreditCard },
];

const providerLinks: NavItem[] = [
	{ label: "Dashboard", href: ROUTES.DASHBOARD_PROVIDER, icon: LayoutDashboard },
	{ label: "Browse Requests", href: ROUTES.DASHBOARD_BROWSE_REQUESTS, icon: Search },
	{ label: "My Proposals", href: ROUTES.DASHBOARD_MY_PROPOSALS, icon: ClipboardList },
	{ label: "My Jobs", href: ROUTES.DASHBOARD_JOBS, icon: Briefcase },
	{ label: "Earnings", href: ROUTES.DASHBOARD_EARNINGS, icon: DollarSign },
	{ label: "Availability", href: ROUTES.DASHBOARD_AVAILABILITY, icon: Clock },
	{ label: "My Profile", href: ROUTES.DASHBOARD_PROVIDER_OVERVIEW, icon: Star },
	{ label: "Portfolio", href: ROUTES.DASHBOARD_PROVIDER_PORTFOLIO, icon: FolderOpen },
	{ label: "Documents", href: ROUTES.DASHBOARD_PROVIDER_DOCUMENTS, icon: FileText },
	{ label: "Reviews", href: ROUTES.DASHBOARD_PROVIDER_REVIEWS, icon: Star },
];

const adminLinks: NavItem[] = [
	{ label: "Admin Overview", href: ROUTES.DASHBOARD_ADMIN, icon: LayoutDashboard },
	{ label: "Users", href: ROUTES.DASHBOARD_ADMIN_USERS, icon: Users },
	{ label: "Disputes", href: ROUTES.DASHBOARD_ADMIN_DISPUTES, icon: AlertTriangle },
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

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
	const Icon = item.icon;
	return (
		<Link
			href={item.href}
			className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${
					isActive ?
						"bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
					:	"text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
				}`}>
			<Icon className='h-4 w-4 flex-shrink-0' />
			<span className='flex-1 min-w-0 truncate'>{item.label}</span>
			{isActive && <ChevronRight className='h-3 w-3 flex-shrink-0 opacity-60' />}
		</Link>
	);
}

export function DashboardSidebar() {
	const pathname = usePathname();
	const { user } = useAuth();

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
		<aside className='w-60 flex-shrink-0 hidden lg:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen'>
			<div className='flex-1 py-6 px-3 overflow-y-auto'>
				<nav className='space-y-1'>
					{mainLinks.map((item) => (
						<NavLink
							key={item.href}
							item={item}
							isActive={isActive(item.href)}
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
							/>
						))}
					</nav>
				</div>
			</div>
		</aside>
	);
}
