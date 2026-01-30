import { describe, expect, it } from "bun:test";
import {
	isValidPath,
	isValidProjectName,
	isValidWorktreeName,
	sanitizeInput,
} from "../../src/utils/validation.ts";

describe("validation utilities", () => {
	describe("isValidProjectName", () => {
		it("should accept valid project names", () => {
			expect(isValidProjectName("my-project")).toBe(true);
			expect(isValidProjectName("my_project")).toBe(true);
			expect(isValidProjectName("my.project")).toBe(true);
			expect(isValidProjectName("myproject123")).toBe(true);
		});

		it("should reject invalid project names", () => {
			expect(isValidProjectName("")).toBe(false);
			expect(isValidProjectName("my project")).toBe(false);
			expect(isValidProjectName("my/project")).toBe(false);
			expect(isValidProjectName("my@project")).toBe(false);
		});
	});

	describe("isValidWorktreeName", () => {
		it("should accept valid worktree names", () => {
			expect(isValidWorktreeName("feature-branch")).toBe(true);
			expect(isValidWorktreeName("user/feature-branch")).toBe(true);
			expect(isValidWorktreeName("fix_bug_123")).toBe(true);
		});

		it("should reject invalid worktree names", () => {
			expect(isValidWorktreeName("")).toBe(false);
			expect(isValidWorktreeName("my worktree")).toBe(false);
			expect(isValidWorktreeName("my@worktree")).toBe(false);
		});
	});

	describe("sanitizeInput", () => {
		it("should remove control characters", () => {
			expect(sanitizeInput("hello\x00world")).toBe("helloworld");
			expect(sanitizeInput("hello\nworld")).toBe("helloworld");
			expect(sanitizeInput("  hello  ")).toBe("hello");
		});
	});

	describe("isValidPath", () => {
		it("should validate existing paths", () => {
			expect(isValidPath("/tmp")).toBe(true);
			expect(isValidPath("/nonexistent-path-12345")).toBe(false);
		});
	});
});
