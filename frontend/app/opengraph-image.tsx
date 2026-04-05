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
				backgroundColor: "#f8fafc",
				backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
			}}>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "40px 80px",
					borderRadius: "24px",
					backgroundColor: "rgba(255,255,255,0.95)",
					boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
				}}>
				<div
					style={{
						fontSize: 64,
						fontWeight: 800,
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						backgroundClip: "text",
						color: "transparent",
						letterSpacing: "-0.02em",
					}}>
					Local Service Marketplace
				</div>
				<div style={{ fontSize: 28, color: "#64748b", marginTop: "16px", textAlign: "center" }}>
					Find Trusted Local Professionals Near You
				</div>
				<div style={{ display: "flex", gap: "24px", marginTop: "32px", fontSize: 20, color: "#475569" }}>
					<span>✅ Verified Providers</span>
					<span>⭐ Real Reviews</span>
					<span>🔒 Secure Payments</span>
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
