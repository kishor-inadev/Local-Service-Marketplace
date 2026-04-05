import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";

describe("Card Component", () => {
	it("renders children", () => {
		render(<Card>Card content</Card>);
		expect(screen.getByText("Card content")).toBeInTheDocument();
	});

	it("applies base styles", () => {
		const { container } = render(<Card>Content</Card>);
		const card = container.firstChild as HTMLElement;
		expect(card.className).toContain("rounded-lg");
		expect(card.className).toContain("border");
	});

	it("applies hover styles when hover prop is true", () => {
		const { container } = render(<Card hover>Content</Card>);
		const card = container.firstChild as HTMLElement;
		expect(card.className).toContain("hover:shadow-md");
	});

	it("does not apply hover styles by default", () => {
		const { container } = render(<Card>Content</Card>);
		const card = container.firstChild as HTMLElement;
		expect(card.className).not.toContain("hover:shadow-md");
	});

	it("applies custom className", () => {
		const { container } = render(<Card className='my-custom'>Content</Card>);
		const card = container.firstChild as HTMLElement;
		expect(card.className).toContain("my-custom");
	});
});

describe("CardHeader Component", () => {
	it("renders children", () => {
		render(<CardHeader>Header</CardHeader>);
		expect(screen.getByText("Header")).toBeInTheDocument();
	});

	it("applies border-b style", () => {
		const { container } = render(<CardHeader>Header</CardHeader>);
		const header = container.firstChild as HTMLElement;
		expect(header.className).toContain("border-b");
	});

	it("applies custom className", () => {
		const { container } = render(<CardHeader className='extra'>Header</CardHeader>);
		const header = container.firstChild as HTMLElement;
		expect(header.className).toContain("extra");
	});
});

describe("CardContent Component", () => {
	it("renders children", () => {
		render(<CardContent>Body</CardContent>);
		expect(screen.getByText("Body")).toBeInTheDocument();
	});

	it("applies padding", () => {
		const { container } = render(<CardContent>Body</CardContent>);
		const content = container.firstChild as HTMLElement;
		expect(content.className).toContain("px-6");
		expect(content.className).toContain("py-4");
	});
});

describe("CardFooter Component", () => {
	it("renders children", () => {
		render(<CardFooter>Footer</CardFooter>);
		expect(screen.getByText("Footer")).toBeInTheDocument();
	});

	it("applies border-t style", () => {
		const { container } = render(<CardFooter>Footer</CardFooter>);
		const footer = container.firstChild as HTMLElement;
		expect(footer.className).toContain("border-t");
	});
});

describe("Card Composition", () => {
	it("renders full card with header, content, and footer", () => {
		render(
			<Card>
				<CardHeader>Title</CardHeader>
				<CardContent>Body text</CardContent>
				<CardFooter>Actions</CardFooter>
			</Card>,
		);
		expect(screen.getByText("Title")).toBeInTheDocument();
		expect(screen.getByText("Body text")).toBeInTheDocument();
		expect(screen.getByText("Actions")).toBeInTheDocument();
	});
});
