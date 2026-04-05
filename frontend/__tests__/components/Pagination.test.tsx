import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Pagination } from "@/components/ui/Pagination";

describe("Pagination Component", () => {
	const defaultProps = { currentPage: 1, totalPages: 5, onPageChange: jest.fn() };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders nothing when totalPages is 1 and no leftContent", () => {
		const { container } = render(
			<Pagination
				currentPage={1}
				totalPages={1}
				onPageChange={jest.fn()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders pagination when totalPages > 1", () => {
		render(<Pagination {...defaultProps} />);
		expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
	});

	it("disables previous button on first page", () => {
		render(
			<Pagination
				{...defaultProps}
				currentPage={1}
			/>,
		);
		const prevBtn = screen.getAllByRole("button")[0];
		expect(prevBtn).toBeDisabled();
	});

	it("disables next button on last page", () => {
		render(
			<Pagination
				{...defaultProps}
				currentPage={5}
			/>,
		);
		const buttons = screen.getAllByRole("button");
		const nextBtn = buttons[buttons.length - 1];
		expect(nextBtn).toBeDisabled();
	});

	it("calls onPageChange with next page", () => {
		const onPageChange = jest.fn();
		render(
			<Pagination
				currentPage={2}
				totalPages={5}
				onPageChange={onPageChange}
			/>,
		);
		const buttons = screen.getAllByRole("button");
		const nextBtn = buttons[buttons.length - 1];
		fireEvent.click(nextBtn);
		expect(onPageChange).toHaveBeenCalledWith(3);
	});

	it("calls onPageChange with previous page", () => {
		const onPageChange = jest.fn();
		render(
			<Pagination
				currentPage={3}
				totalPages={5}
				onPageChange={onPageChange}
			/>,
		);
		const prevBtn = screen.getAllByRole("button")[0];
		fireEvent.click(prevBtn);
		expect(onPageChange).toHaveBeenCalledWith(2);
	});

	it("calls onPageChange when page number clicked", () => {
		const onPageChange = jest.fn();
		render(
			<Pagination
				currentPage={1}
				totalPages={5}
				onPageChange={onPageChange}
			/>,
		);
		fireEvent.click(screen.getAllByText("3")[0]);
		expect(onPageChange).toHaveBeenCalledWith(3);
	});

	it("highlights current page", () => {
		render(
			<Pagination
				{...defaultProps}
				currentPage={3}
			/>,
		);
		const allThrees = screen.getAllByText("3");
		const currentBtn = allThrees.find((el) => el.tagName === "BUTTON");
		expect(currentBtn).toBeDefined();
		expect(currentBtn!.className).toContain("bg-primary-600");
	});

	it("shows ellipsis for many pages", () => {
		render(
			<Pagination
				currentPage={5}
				totalPages={10}
				onPageChange={jest.fn()}
			/>,
		);
		const ellipses = screen.getAllByText("...");
		expect(ellipses.length).toBeGreaterThanOrEqual(1);
	});

	it("renders leftContent when provided", () => {
		render(
			<Pagination
				currentPage={1}
				totalPages={1}
				onPageChange={jest.fn()}
				leftContent={<span>Showing 1-10 of 10</span>}
			/>,
		);
		expect(screen.getAllByText("Showing 1-10 of 10").length).toBeGreaterThanOrEqual(1);
	});
});
