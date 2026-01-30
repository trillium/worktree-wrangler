/**
 * Input validation utilities
 */

import { existsSync, statSync } from "node:fs";
import { expandTilde } from "./filesystem.ts";

/**
 * Check if a path is valid (exists and accessible)
 */
export function isValidPath(path: string): boolean {
	try {
		const expanded = expandTilde(path);
		return existsSync(expanded);
	} catch {
		return false;
	}
}

/**
 * Check if a project name is valid
 * Project names should be alphanumeric with hyphens, underscores, or dots
 */
export function isValidProjectName(name: string): boolean {
	if (!name || name.length === 0) {
		return false;
	}

	// Allow alphanumeric, hyphens, underscores, dots
	const validPattern = /^[a-zA-Z0-9._-]+$/;
	return validPattern.test(name);
}

/**
 * Check if a worktree name is valid
 * Worktree names should be alphanumeric with hyphens, underscores, or slashes (for user/branch format)
 */
export function isValidWorktreeName(name: string): boolean {
	if (!name || name.length === 0) {
		return false;
	}

	// Allow alphanumeric, hyphens, underscores, slashes (for user/branch format)
	const validPattern = /^[a-zA-Z0-9._/-]+$/;
	return validPattern.test(name);
}

/**
 * Sanitize input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
	// Remove null bytes, newlines, and other control characters
	return input
		.replace(/[\x00-\x1F\x7F]/g, "")
		.trim();
}

/**
 * Validate that a script file is executable
 */
export function isExecutable(path: string): boolean {
	try {
		const expanded = expandTilde(path);
		if (!existsSync(expanded)) {
			return false;
		}

		const stats = statSync(expanded);
		if (!stats.isFile()) {
			return false;
		}

		// Check if executable bit is set (Unix-like systems)
		// biome-ignore lint/suspicious/noExplicitAny: Node.js fs.Stats uses bitwise operations
		const isExec = (stats.mode & 0o111) !== 0;
		return isExec;
	} catch {
		return false;
	}
}

/**
 * Validate directory path exists and is a directory
 */
export function isValidDirectory(path: string): boolean {
	try {
		const expanded = expandTilde(path);
		if (!existsSync(expanded)) {
			return false;
		}
		return statSync(expanded).isDirectory();
	} catch {
		return false;
	}
}
