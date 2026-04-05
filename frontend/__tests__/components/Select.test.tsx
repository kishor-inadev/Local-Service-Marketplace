import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Select } from "@/components/ui/Select";

const options = [
	{ value: "plumbing", label: "Plumbing" },
	{ value: "electrical", label: "Electrical" },
	{ value: "cleaning", label: "Cleaning" },
];

describe("Select Component", () => {
	it("renders with label", () => {
		render(
			<Select
				label='Category'
				options={options}
			/>,
		);
		expect(screen.getByText("Category")).toBeInTheDocument();
	});

	it("associates label with select via htmlFor", () => {
		render(
			<Select
				label='Category'
				id='cat'
				options={options}
			/>,
		);
		expect(screen.getByLabelText("Category")).toBeInTheDocument();
	});

	it("renders all options", () => {
		render(
			<Select
				label='Category'
				options={options}
			/>,
		);
		expect(screen.getByText("Plumbing")).toBeInTheDocument();
		expect(screen.getByText("Electrical")).toBeInTheDocument();
		expect(screen.getByText("Cleaning")).toBeInTheDocument();
	});

	it("renders default empty option", () => {
		render(
			<Select
				label='Category'
				options={options}
			/>,
		);
		expect(screen.getByText("Select an option")).toBeInTheDocument();
	});

	it("shows required indicator", () => {
		render(
			<Select
				label='Category'
				options={options}
				required
			/>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("displays error message", () => {
		render(
			<Select
				label='Category'
				options={options}
				error='Required field'
			/>,
		);
		expect(screen.getByText("Required field")).toBeInTheDocument();
	});

	it("applies error styling", () => {
		const { container } = render(
			<Select
				options={options}
				error='Error'
			/>,
		);
		const select = container.querySelector("select");
		expect(select?.className).toContain("border-red-500");
	});

	it("handles disabled state", () => {
		render(
			<Select
				label='Category'
				options={options}
				disabled
			/>,
		);
		expect(screen.getByLabelText("Category")).toBeDisabled();
	});

	it("handles selection change", async () => {
		const user = userEvent.setup();
		render(
			<Select
				label='Category'
				options={options}
			/>,
		);
		const select = screen.getByLabelText("Category");
		await user.selectOptions(select, "plumbing");
		expect(select).toHaveValue("plumbing");
	});

	it("forwards ref", () => {
		const ref = { current: null } as React.RefObject<HTMLSelectElement>;
		render(
			<Select
				ref={ref}
				options={options}
			/>,
		);
		expect(ref.current).toBeInstanceOf(HTMLSelectElement);
	});
});
