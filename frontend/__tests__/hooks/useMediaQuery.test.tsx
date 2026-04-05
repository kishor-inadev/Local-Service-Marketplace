import { renderHook, act } from "@testing-library/react";
import { useMediaQuery, useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";

describe("useMediaQuery Hook", () => {
	let matchMediaMock: jest.Mock;
	let addEventListenerMock: jest.Mock;
	let removeEventListenerMock: jest.Mock;

	beforeEach(() => {
		addEventListenerMock = jest.fn();
		removeEventListenerMock = jest.fn();
		matchMediaMock = jest
			.fn()
			.mockImplementation((query: string) => ({
				matches: false,
				media: query,
				addEventListener: addEventListenerMock,
				removeEventListener: removeEventListenerMock,
				onchange: null,
			}));
		Object.defineProperty(window, "matchMedia", { writable: true, value: matchMediaMock });
	});

	it("returns false by default", () => {
		const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
		expect(result.current).toBe(false);
	});

	it("returns true when media query matches", () => {
		matchMediaMock.mockImplementation((query: string) => ({
			matches: true,
			media: query,
			addEventListener: addEventListenerMock,
			removeEventListener: removeEventListenerMock,
		}));

		const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
		expect(result.current).toBe(true);
	});

	it("updates when media query changes", () => {
		let changeHandler: (e: MediaQueryListEvent) => void;
		addEventListenerMock.mockImplementation((_event: string, handler: (e: MediaQueryListEvent) => void) => {
			changeHandler = handler;
		});

		const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
		expect(result.current).toBe(false);

		act(() => {
			// Update the mock so re-evaluation also returns true
			matchMediaMock.mockImplementation((query: string) => ({
				matches: true,
				media: query,
				addEventListener: addEventListenerMock,
				removeEventListener: removeEventListenerMock,
			}));
			changeHandler({ matches: true } as MediaQueryListEvent);
		});
		expect(result.current).toBe(true);
	});

	it("registers change listener", () => {
		renderHook(() => useMediaQuery("(max-width: 768px)"));
		expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
	});

	it("removes listener on unmount", () => {
		const { unmount } = renderHook(() => useMediaQuery("(max-width: 768px)"));
		unmount();
		expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
	});
});

describe("useIsMobile Hook", () => {
	it("calls matchMedia with mobile breakpoint", () => {
		const spy = jest
			.fn()
			.mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
		Object.defineProperty(window, "matchMedia", { writable: true, value: spy });

		renderHook(() => useIsMobile());
		expect(spy).toHaveBeenCalledWith("(max-width: 768px)");
	});
});

describe("useIsTablet Hook", () => {
	it("calls matchMedia with tablet breakpoint", () => {
		const spy = jest
			.fn()
			.mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
		Object.defineProperty(window, "matchMedia", { writable: true, value: spy });

		renderHook(() => useIsTablet());
		expect(spy).toHaveBeenCalledWith("(min-width: 769px) and (max-width: 1024px)");
	});
});
