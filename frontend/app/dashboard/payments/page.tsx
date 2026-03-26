import { redirect } from "next/navigation";
import { ROUTES } from "@/config/constants";

export default function PaymentsPage() {
	redirect(ROUTES.DASHBOARD_PAYMENT_HISTORY);
}
