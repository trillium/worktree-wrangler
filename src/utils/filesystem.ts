/**
 * Filesystem utilities
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Result } from "../types/result.ts";
import { failure, success } from "../types/result.ts";

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
	try {
		return existsSync(path) && statSync(path).isFile();
	} catch {
		return false;
	}
}

/**
 * Check if a directory exists
 */
export async function directoryExists(path: string): Promise<boolean> {
	try {
		return existsSync(path) && statSync(path).isDirectory();
	} catch {
		return false;
	}
}

/**
 * Read a file's contents
 */
export async function readFile(path: string): Promise<Result<string>> {
	try {
		const content = readFileSync(path, "utf-8");
		return success(content);
	} catch (err) {
		if (err instanceof Error) {
			return failure(err);
		}
		return failure(new Error(String(err)));
	}
}

/**
 * Write content to a file
 */
export async function writeFile(
	path: string,
	content: string,
): Promise<Result<void>> {
	try {
		// Ensure parent directory exists
		const dir = dirname(path);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(path, content, "utf-8");
		return success(undefined);
	} catch (err) {
		if (err instanceof Error) {
			return failure(err);
		}
		return failure(new Error(String(err)));
	}
}

/**
 * Expand tilde (~) in paths
 */
export function expandTilde(path: string): string {
	if (path.startsWith("~/") || path === "~") {
		const home = process.env.HOME || process.env.USERPROFILE;
		if (!home) {
			return path;
		}
		return path.replace(/^~/, home);
	}
	return path;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(path: string): Promise<Result<void>> {
	try {
		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
		}
		return success(undefined);
	} catch (err) {
		if (err instanceof Error) {
			return failure(err);
		}
		return failure(new Error(String(err)));
	}
}

/**
 * Resolve a path to an absolute path
 */
export function resolvePath(path: string): string {
	return resolve(expandTilde(path));
}

/**
 * Synchronously check if a file exists
 */
export function fileExistsSync(path: string): boolean {
	try {
		return existsSync(path) && statSync(path).isFile();
	} catch {
		return false;
	}
}

/**
 * Synchronously check if a directory exists
 */
export function directoryExistsSync(path: string): boolean {
	try {
		return existsSync(path) && statSync(path).isDirectory();
	} catch {
		return false;
	}
}
