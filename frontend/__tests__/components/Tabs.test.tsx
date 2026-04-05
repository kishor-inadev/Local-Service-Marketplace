import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Tabs } from "@/components/ui/Tabs";

const tabs = [
	{ id: "overview", label: "Overview", content: <div>Overview content</div> },
	{ id: "details", label: "Details", content: <div>Details content</div> },
	{ id: "reviews", label: "Reviews", content: <div>Reviews content</div> },
];

describe("Tabs Component", () => {
	it("renders all tab labels", () => {
		render(<Tabs tabs={tabs} />);
		expect(screen.getByText("Overview")).toBeInTheDocument();
		expect(screen.getByText("Details")).toBeInTheDocument();
		expect(screen.getByText("Reviews")).toBeInTheDocument();
	});

	it("shows first tab content by default", () => {
		render(<Tabs tabs={tabs} />);
		expect(screen.getByText("Overview content")).toBeInTheDocument();
	});

	it("switches tab content on click", () => {
		render(<Tabs tabs={tabs} />);
		fireEvent.click(screen.getByText("Details"));
		expect(screen.getByText("Details content")).toBeInTheDocument();
		expect(screen.queryByText("Overview content")).not.toBeInTheDocument();
	});

	it("respects defaultTab prop", () => {
		render(
			<Tabs
				tabs={tabs}
				defaultTab='reviews'
			/>,
		);
		expect(screen.getByText("Reviews content")).toBeInTheDocument();
	});

	it("calls onChange when tab changes", () => {
		const onChange = jest.fn();
		render(
			<Tabs
				tabs={tabs}
				onChange={onChange}
			/>,
		);
		fireEvent.click(screen.getByText("Details"));
		expect(onChange).toHaveBeenCalledWith("details");
	});

	it("handles disabled tabs", () => {
		const tabsWithDisabled = [
			...tabs.slice(0, 2),
			{ id: "reviews", label: "Reviews", content: <div>Reviews</div>, disabled: true },
		];
		render(<Tabs tabs={tabsWithDisabled} />);
		const disabledBtn = screen.getByText("Reviews");
		expect(disabledBtn).toBeDisabled();
	});

	it("does not switch to disabled tab on click", () => {
		const tabsWithDisabled = [
			{ id: "overview", label: "Overview", content: <div>Overview content</div> },
			{ id: "disabled", label: "Disabled", content: <div>Disabled content</div>, disabled: true },
		];
		render(<Tabs tabs={tabsWithDisabled} />);
		fireEvent.click(screen.getByText("Disabled"));
		expect(screen.getByText("Overview content")).toBeInTheDocument();
	});

	it("applies active tab styling", () => {
		render(<Tabs tabs={tabs} />);
		const activeBtn = screen.getByText("Overview");
		expect(activeBtn.className).toContain("border-primary-600");
	});

	it("has aria-label on nav", () => {
		render(<Tabs tabs={tabs} />);
		expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
	});

	it("marks active tab with aria-current", () => {
		render(<Tabs tabs={tabs} />);
		const activeBtn = screen.getByText("Overview");
		expect(activeBtn).toHaveAttribute("aria-current", "page");
	});
});
