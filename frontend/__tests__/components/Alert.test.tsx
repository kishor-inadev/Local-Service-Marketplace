import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Alert } from "@/components/ui/Alert";

describe("Alert Component", () => {
	it("renders message", () => {
		render(<Alert message='Something happened' />);
		expect(screen.getByText("Something happened")).toBeInTheDocument();
	});

	it("renders title when provided", () => {
		render(
			<Alert
				title='Warning'
				message='Be careful'
			/>,
		);
		expect(screen.getByText("Warning")).toBeInTheDocument();
		expect(screen.getByText("Be careful")).toBeInTheDocument();
	});

	it("renders info variant by default", () => {
		const { container } = render(<Alert message='Info message' />);
		expect(container.querySelector(".bg-blue-50")).toBeInTheDocument();
	});

	it("renders success variant", () => {
		const { container } = render(
			<Alert
				type='success'
				message='Done!'
			/>,
		);
		expect(container.querySelector(".bg-green-50")).toBeInTheDocument();
	});

	it("renders warning variant", () => {
		const { container } = render(
			<Alert
				type='warning'
				message='Watch out'
			/>,
		);
		expect(container.querySelector(".bg-yellow-50")).toBeInTheDocument();
	});

	it("renders error variant", () => {
		const { container } = render(
			<Alert
				type='error'
				message='Failed'
			/>,
		);
		expect(container.querySelector(".bg-red-50")).toBeInTheDocument();
	});

	it("renders close button when onClose provided", () => {
		const onClose = jest.fn();
		render(
			<Alert
				message='Closeable'
				onClose={onClose}
			/>,
		);
		const closeBtn = screen.getByRole("button");
		expect(closeBtn).toBeInTheDocument();
	});

	it("calls onClose when close button clicked", () => {
		const onClose = jest.fn();
		render(
			<Alert
				message='Closeable'
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByRole("button"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("renders icon for each type", () => {
		const { container: info } = render(
			<Alert
				type='info'
				message='msg'
			/>,
		);
		expect(info.querySelector("svg")).toBeInTheDocument();

		const { container: success } = render(
			<Alert
				type='success'
				message='msg'
			/>,
		);
		expect(success.querySelector("svg")).toBeInTheDocument();

		const { container: warning } = render(
			<Alert
				type='warning'
				message='msg'
			/>,
		);
		expect(warning.querySelector("svg")).toBeInTheDocument();

		const { container: error } = render(
			<Alert
				type='error'
				message='msg'
			/>,
		);
		expect(error.querySelector("svg")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<Alert
				message='Styled'
				className='my-alert'
			/>,
		);
		const alert = container.firstChild as HTMLElement;
		expect(alert.className).toContain("my-alert");
	});
});
