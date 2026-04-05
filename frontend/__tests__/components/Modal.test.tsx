import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Modal } from "@/components/ui/Modal";

// Mock the FocusTrap utility
jest.mock("@/utils/accessibility", () => ({
	FocusTrap: jest.fn().mockImplementation(() => ({ activate: jest.fn(), deactivate: jest.fn() })),
}));

describe("Modal Component", () => {
	const defaultProps = { isOpen: true, onClose: jest.fn(), title: "Test Modal", children: <p>Modal body</p> };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders when isOpen is true", () => {
		render(<Modal {...defaultProps} />);
		expect(screen.getByText("Test Modal")).toBeInTheDocument();
		expect(screen.getByText("Modal body")).toBeInTheDocument();
	});

	it("does not render when isOpen is false", () => {
		render(
			<Modal
				{...defaultProps}
				isOpen={false}
			/>,
		);
		expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
	});

	it('has role="dialog" and aria-modal', () => {
		render(<Modal {...defaultProps} />);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
	});

	it("has aria-labelledby pointing to title", () => {
		render(<Modal {...defaultProps} />);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
	});

	it("does not set aria-labelledby when no title", () => {
		render(
			<Modal
				isOpen={true}
				onClose={jest.fn()}>
				Content
			</Modal>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog).not.toHaveAttribute("aria-labelledby");
	});

	it("calls onClose when Escape is pressed", () => {
		const onClose = jest.fn();
		render(
			<Modal
				{...defaultProps}
				onClose={onClose}
			/>,
		);
		fireEvent.keyDown(document, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when backdrop is clicked", () => {
		const onClose = jest.fn();
		const { container } = render(
			<Modal
				{...defaultProps}
				onClose={onClose}
			/>,
		);
		const backdrop = container.querySelector(".bg-black");
		fireEvent.click(backdrop!);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not close when modal content is clicked", () => {
		const onClose = jest.fn();
		render(
			<Modal
				{...defaultProps}
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByText("Modal body"));
		expect(onClose).not.toHaveBeenCalled();
	});

	it("renders close button by default", () => {
		render(<Modal {...defaultProps} />);
		const closeButton = screen.getByRole("button");
		expect(closeButton).toBeInTheDocument();
	});

	it("hides close button when showCloseButton is false", () => {
		render(
			<Modal
				{...defaultProps}
				showCloseButton={false}
			/>,
		);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("calls onClose when close button clicked", () => {
		const onClose = jest.fn();
		render(
			<Modal
				{...defaultProps}
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByRole("button"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("applies small size class", () => {
		render(
			<Modal
				{...defaultProps}
				size='sm'
			/>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("max-w-md");
	});

	it("applies large size class", () => {
		render(
			<Modal
				{...defaultProps}
				size='lg'
			/>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("max-w-2xl");
	});

	it("applies xl size class", () => {
		render(
			<Modal
				{...defaultProps}
				size='xl'
			/>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("max-w-4xl");
	});

	it("locks body scroll when open", () => {
		render(<Modal {...defaultProps} />);
		expect(document.body.style.overflow).toBe("hidden");
	});

	it("restores body scroll on unmount", () => {
		const { unmount } = render(<Modal {...defaultProps} />);
		unmount();
		expect(document.body.style.overflow).toBe("unset");
	});
});
