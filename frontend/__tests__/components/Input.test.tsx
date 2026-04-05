import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Input } from "@/components/ui/Input";

describe("Input Component", () => {
	it("renders without label", () => {
		render(<Input placeholder='Enter text' />);
		expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
	});

	it("renders with label", () => {
		render(<Input label='Email' />);
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("associates label with input via htmlFor", () => {
		render(
			<Input
				label='Username'
				id='username'
			/>,
		);
		const input = screen.getByLabelText("Username");
		expect(input).toBeInTheDocument();
	});

	it("shows required indicator", () => {
		render(
			<Input
				label='Name'
				required
			/>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("displays error message", () => {
		render(
			<Input
				label='Email'
				error='Invalid email'
			/>,
		);
		expect(screen.getByText("Invalid email")).toBeInTheDocument();
	});

	it("displays helper text when no error", () => {
		render(
			<Input
				label='Name'
				helperText='Enter your full name'
			/>,
		);
		expect(screen.getByText("Enter your full name")).toBeInTheDocument();
	});

	it("hides helper text when error is present", () => {
		render(
			<Input
				label='Name'
				helperText='Help'
				error='Required'
			/>,
		);
		expect(screen.queryByText("Help")).not.toBeInTheDocument();
		expect(screen.getByText("Required")).toBeInTheDocument();
	});

	it("applies error styling", () => {
		const { container } = render(<Input error='Bad input' />);
		const input = container.querySelector("input");
		expect(input?.className).toContain("border-red-500");
	});

	it("handles disabled state", () => {
		render(
			<Input
				label='Disabled'
				disabled
			/>,
		);
		expect(screen.getByLabelText("Disabled")).toBeDisabled();
	});

	it("accepts user input", async () => {
		const user = userEvent.setup();
		render(<Input label='Name' />);
		const input = screen.getByLabelText("Name");
		await user.type(input, "John Doe");
		expect(input).toHaveValue("John Doe");
	});

	it("forwards ref", () => {
		const ref = { current: null } as React.RefObject<HTMLInputElement>;
		render(<Input ref={ref} />);
		expect(ref.current).toBeInstanceOf(HTMLInputElement);
	});
});
