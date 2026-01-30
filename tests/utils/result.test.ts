import { describe, expect, it } from "bun:test";
import { success, failure } from "../../src/types/result.ts";

describe("Result type", () => {
	it("should create success results", () => {
		const result = success("test value");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("test value");
		}
	});

	it("should create failure results", () => {
		const error = new Error("test error");
		const result = failure(error);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(error);
		}
	});
});
