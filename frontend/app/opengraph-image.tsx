import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Local Service Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#1e1b4b",
				backgroundImage:
					"radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)",
			}}>
			{/* Card */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "48px 80px",
					borderRadius: "28px",
					backgroundColor: "rgba(255,255,255,0.97)",
					boxShadow: "0 30px 60px -15px rgba(0,0,0,0.35)",
					maxWidth: "900px",
					width: "100%",
				}}>
				{/* Logo mark */}
				<div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
					<div
						style={{
							height: "52px",
							width: "52px",
							borderRadius: "14px",
							background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 26,
							fontWeight: 900,
							color: "#fff",
							boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
						}}>
						LS
					</div>
					<div
						style={{
							fontSize: 28,
							fontWeight: 700,
							color: "#1e1b4b",
							letterSpacing: "-0.01em",
						}}>
						<span style={{ color: "#6366f1" }}>Local</span>Service Marketplace
					</div>
				</div>

				<div
					style={{
						fontSize: 58,
						fontWeight: 800,
						background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #10b981 100%)",
						backgroundClip: "text",
						color: "transparent",
						letterSpacing: "-0.03em",
						textAlign: "center",
						lineHeight: 1.1,
					}}>
					Find Trusted Local Professionals
				</div>
				<div style={{ fontSize: 24, color: "#64748b", marginTop: "18px", textAlign: "center", maxWidth: "600px" }}>
					Post your request free · Compare verified providers · Hire with confidence
				</div>
				<div
					style={{
						display: "flex",
						gap: "20px",
						marginTop: "28px",
						fontSize: 18,
						color: "#334155",
						backgroundColor: "#f8fafc",
						padding: "14px 28px",
						borderRadius: "50px",
						border: "1px solid #e2e8f0",
					}}>
					<span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
						<span style={{ color: "#10b981" }}>✓</span> Verified Providers
					</span>
					<span style={{ color: "#cbd5e1" }}>·</span>
					<span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
						<span style={{ color: "#f59e0b" }}>★</span> 4.9/5 Rating
					</span>
					<span style={{ color: "#cbd5e1" }}>·</span>
					<span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
						<span style={{ color: "#6366f1" }}>🔒</span> Secure Payments
					</span>
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
