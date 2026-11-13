import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

afterEach(() => vi.restoreAllMocks());

it("uses module-imported React hooks and updates at the mobile breakpoint", () => {
  let change = () => {};
  let matches = true;
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    get matches() { return matches; },
    addEventListener: (_: string, listener: () => void) => { change = listener; },
    removeEventListener: vi.fn(),
  })));
  vi.spyOn(window, "innerWidth", "get").mockReturnValue(393);
  const { result } = renderHook(() => useIsMobile());
  expect(result.current).toBe(true);
  matches = false;
  vi.spyOn(window, "innerWidth", "get").mockReturnValue(1472);
  act(() => change());
  expect(result.current).toBe(false);
  vi.unstubAllGlobals();
});