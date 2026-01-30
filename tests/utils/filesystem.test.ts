import { describe, expect, it } from "bun:test";
import {
	expandTilde,
	fileExistsSync,
	directoryExistsSync,
} from "../../src/utils/filesystem.ts";

describe("filesystem utilities", () => {
	describe("expandTilde", () => {
		it("should expand tilde to home directory", () => {
			const expanded = expandTilde("~/test");
			expect(expanded).not.toBe("~/test");
			expect(expanded).toContain("/test");
		});

		it("should not modify paths without tilde", () => {
			expect(expandTilde("/absolute/path")).toBe("/absolute/path");
			expect(expandTilde("relative/path")).toBe("relative/path");
		});
	});

	describe("fileExistsSync", () => {
		it("should detect existing files", () => {
			expect(fileExistsSync("/tmp")).toBe(false); // /tmp is a directory
			expect(fileExistsSync("/nonexistent")).toBe(false);
		});
	});

	describe("directoryExistsSync", () => {
		it("should detect existing directories", () => {
			expect(directoryExistsSync("/tmp")).toBe(true);
			expect(directoryExistsSync("/nonexistent")).toBe(false);
		});
	});
});
