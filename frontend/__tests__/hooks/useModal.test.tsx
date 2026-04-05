import { renderHook, act } from "@testing-library/react";
import { useModal } from "@/hooks/useModal";

describe("useModal Hook", () => {
	it("starts closed by default", () => {
		const { result } = renderHook(() => useModal());
		expect(result.current.isOpen).toBe(false);
	});

	it("starts open when initialState is true", () => {
		const { result } = renderHook(() => useModal(true));
		expect(result.current.isOpen).toBe(true);
	});

	it("opens the modal", () => {
		const { result } = renderHook(() => useModal());
		act(() => {
			result.current.open();
		});
		expect(result.current.isOpen).toBe(true);
	});

	it("closes the modal", () => {
		const { result } = renderHook(() => useModal(true));
		act(() => {
			result.current.close();
		});
		expect(result.current.isOpen).toBe(false);
	});

	it("toggles the modal", () => {
		const { result } = renderHook(() => useModal());

		act(() => {
			result.current.toggle();
		});
		expect(result.current.isOpen).toBe(true);

		act(() => {
			result.current.toggle();
		});
		expect(result.current.isOpen).toBe(false);
	});

	it("returns stable function references", () => {
		const { result, rerender } = renderHook(() => useModal());
		const { open, close, toggle } = result.current;
		rerender();
		expect(result.current.open).toBe(open);
		expect(result.current.close).toBe(close);
		expect(result.current.toggle).toBe(toggle);
	});
});
