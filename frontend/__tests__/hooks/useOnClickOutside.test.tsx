import { renderHook } from "@testing-library/react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useRef } from "react";

describe("useOnClickOutside Hook", () => {
	it("calls handler when clicking outside element", () => {
		const handler = jest.fn();
		const div = document.createElement("div");
		document.body.appendChild(div);

		renderHook(() => {
			const ref = { current: div } as React.RefObject<HTMLElement>;
			useOnClickOutside(ref, handler);
		});

		// Click outside
		const outsideEvent = new MouseEvent("mousedown", { bubbles: true });
		document.body.dispatchEvent(outsideEvent);

		expect(handler).toHaveBeenCalledTimes(1);
		document.body.removeChild(div);
	});

	it("does not call handler when clicking inside element", () => {
		const handler = jest.fn();
		const div = document.createElement("div");
		const child = document.createElement("span");
		div.appendChild(child);
		document.body.appendChild(div);

		renderHook(() => {
			const ref = { current: div } as React.RefObject<HTMLElement>;
			useOnClickOutside(ref, handler);
		});

		// Click inside
		const insideEvent = new MouseEvent("mousedown", { bubbles: true });
		child.dispatchEvent(insideEvent);

		expect(handler).not.toHaveBeenCalled();
		document.body.removeChild(div);
	});

	it("does not call handler when ref is null", () => {
		const handler = jest.fn();

		renderHook(() => {
			const ref = { current: null } as React.RefObject<HTMLElement>;
			useOnClickOutside(ref, handler);
		});

		const event = new MouseEvent("mousedown", { bubbles: true });
		document.body.dispatchEvent(event);

		expect(handler).not.toHaveBeenCalled();
	});

	it("handles touch events", () => {
		const handler = jest.fn();
		const div = document.createElement("div");
		document.body.appendChild(div);

		renderHook(() => {
			const ref = { current: div } as React.RefObject<HTMLElement>;
			useOnClickOutside(ref, handler);
		});

		const touchEvent = new TouchEvent("touchstart", { bubbles: true });
		document.body.dispatchEvent(touchEvent);

		expect(handler).toHaveBeenCalledTimes(1);
		document.body.removeChild(div);
	});

	it("cleans up listeners on unmount", () => {
		const handler = jest.fn();
		const div = document.createElement("div");
		document.body.appendChild(div);
		const removeSpy = jest.spyOn(document, "removeEventListener");

		const { unmount } = renderHook(() => {
			const ref = { current: div } as React.RefObject<HTMLElement>;
			useOnClickOutside(ref, handler);
		});

		unmount();
		expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));

		removeSpy.mockRestore();
		document.body.removeChild(div);
	});
});
