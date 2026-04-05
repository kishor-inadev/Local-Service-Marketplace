import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Textarea } from "@/components/ui/Textarea";

describe("Textarea Component", () => {
	it("renders without label", () => {
		render(<Textarea placeholder='Enter description' />);
		expect(screen.getByPlaceholderText("Enter description")).toBeInTheDocument();
	});

	it("renders with label", () => {
		render(<Textarea label='Description' />);
		expect(screen.getByText("Description")).toBeInTheDocument();
	});

	it("associates label with textarea via htmlFor", () => {
		render(
			<Textarea
				label='Details'
				id='details'
			/>,
		);
		expect(screen.getByLabelText("Details")).toBeInTheDocument();
	});

	it("shows required indicator", () => {
		render(
			<Textarea
				label='Notes'
				required
			/>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("displays error message", () => {
		render(
			<Textarea
				label='Notes'
				error='Too short'
			/>,
		);
		expect(screen.getByText("Too short")).toBeInTheDocument();
	});

	it("displays helper text when no error", () => {
		render(
			<Textarea
				label='Notes'
				helperText='Max 500 chars'
			/>,
		);
		expect(screen.getByText("Max 500 chars")).toBeInTheDocument();
	});

	it("hides helper text when error is present", () => {
		render(
			<Textarea
				label='Notes'
				helperText='Help'
				error='Required'
			/>,
		);
		expect(screen.queryByText("Help")).not.toBeInTheDocument();
		expect(screen.getByText("Required")).toBeInTheDocument();
	});

	it("applies error styling", () => {
		const { container } = render(<Textarea error='Error' />);
		const textarea = container.querySelector("textarea");
		expect(textarea?.className).toContain("border-red-500");
	});

	it("handles disabled state", () => {
		render(
			<Textarea
				label='Disabled'
				disabled
			/>,
		);
		expect(screen.getByLabelText("Disabled")).toBeDisabled();
	});

	it("accepts user input", async () => {
		const user = userEvent.setup();
		render(<Textarea label='Notes' />);
		const textarea = screen.getByLabelText("Notes");
		await user.type(textarea, "Some notes here");
		expect(textarea).toHaveValue("Some notes here");
	});

	it("has default rows", () => {
		const { container } = render(<Textarea />);
		const textarea = container.querySelector("textarea");
		expect(textarea).toHaveAttribute("rows", "4");
	});

	it("forwards ref", () => {
		const ref = { current: null } as React.RefObject<HTMLTextAreaElement>;
		render(<Textarea ref={ref} />);
		expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
	});
});
