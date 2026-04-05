import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge } from "@/components/ui/Badge";

describe("Badge Component", () => {
	it("renders children text", () => {
		render(<Badge>Active</Badge>);
		expect(screen.getByText("Active")).toBeInTheDocument();
	});

	it("applies gray variant by default", () => {
		const { container } = render(<Badge>Default</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-gray-100");
	});

	it("applies blue variant", () => {
		const { container } = render(<Badge variant='blue'>Blue</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-blue-100");
	});

	it("applies green variant", () => {
		const { container } = render(<Badge variant='green'>Green</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-green-100");
	});

	it("applies red variant", () => {
		const { container } = render(<Badge variant='red'>Red</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-red-100");
	});

	it("applies yellow variant", () => {
		const { container } = render(<Badge variant='yellow'>Yellow</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-yellow-100");
	});

	it("applies success variant", () => {
		const { container } = render(<Badge variant='success'>Success</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-green-100");
	});

	it("applies danger variant", () => {
		const { container } = render(<Badge variant='danger'>Danger</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("bg-red-100");
	});

	it("applies sm size", () => {
		const { container } = render(<Badge size='sm'>Small</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("text-xs");
	});

	it("applies md size by default", () => {
		const { container } = render(<Badge>Medium</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("text-sm");
	});

	it("applies lg size", () => {
		const { container } = render(<Badge size='lg'>Large</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("text-base");
	});

	it("applies rounded-full class", () => {
		const { container } = render(<Badge>Rounded</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("rounded-full");
	});

	it("applies custom className", () => {
		const { container } = render(<Badge className='my-class'>Custom</Badge>);
		const badge = container.querySelector("span");
		expect(badge?.className).toContain("my-class");
	});
});
