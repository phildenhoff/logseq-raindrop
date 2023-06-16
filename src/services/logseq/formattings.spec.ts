import { describe, it, expect } from "vitest";
import { formatDateForSettings } from "./formatting.js";

describe("formattings", () => {
  it("should format correctly", () => {
    const input = new Date(
      "Thu Jun 15 2023 19:28:00 GMT-0700 (Pacific Daylight Time)"
    );
    const expected = "2023-06-15T19:28:00";

    const actual = formatDateForSettings(input);
    expect(actual).toBe(expected);
  });
});
