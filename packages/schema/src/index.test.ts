import { describe, expect, it } from "vitest";
import { isSection, SECTIONS } from "./index.ts";

describe("sections", () => {
  it("has the three check-ins in order", () => {
    expect(Object.keys(SECTIONS)).toEqual(["mor", "mid", "eve"]);
  });

  it("recognises section codes and nothing else", () => {
    expect(isSection("mor")).toBe(true);
    expect(isSection("morning")).toBe(false);
    expect(isSection("toString")).toBe(false);
  });
});
