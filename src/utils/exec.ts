/**
 * Command execution utilities
 */

import { spawn } from "node:child_process";
import type { Result } from "../types/result.ts";
import { failure, success } from "../types/result.ts";

export interface ExecResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

export interface ExecOptions {
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	timeout?: number;
}

/**
 * Execute a command asynchronously
 */
export async function executeCommand(
	command: string,
	args: string[],
	options?: ExecOptions,
): Promise<Result<string>> {
	return new Promise((resolve) => {
		const proc = spawn(command, args, {
			cwd: options?.cwd,
			env: { ...process.env, ...options?.env },
			shell: false,
		});

		let stdout = "";
		let stderr = "";

		proc.stdout?.on("data", (data) => {
			stdout += data.toString();
		});

		proc.stderr?.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("close", (code) => {
			if (code === 0) {
				resolve(success(stdout.trim()));
			} else {
				resolve(
					failure(
						new Error(`Command failed with exit code ${code}: ${stderr.trim()}`),
					),
				);
			}
		});

		proc.on("error", (err) => {
			resolve(failure(err));
		});

		if (options?.timeout) {
			setTimeout(() => {
				proc.kill();
				resolve(failure(new Error("Command timed out")));
			}, options.timeout);
		}
	});
}

/**
 * Execute a command synchronously (blocking)
 */
export function executeCommandSync(
	command: string,
	args: string[],
	options?: ExecOptions,
): Result<string> {
	try {
		const { execSync } = require("node:child_process");
		const result = execSync(`${command} ${args.join(" ")}`, {
			cwd: options?.cwd,
			env: { ...process.env, ...options?.env },
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		return success(result.toString().trim());
	} catch (err) {
		if (err instanceof Error) {
			return failure(err);
		}
		return failure(new Error(String(err)));
	}
}

/**
 * Execute a command and return full result (stdout, stderr, exitCode)
 */
export async function executeCommandWithResult(
	command: string,
	args: string[],
	options?: ExecOptions,
): Promise<ExecResult> {
	return new Promise((resolve) => {
		const proc = spawn(command, args, {
			cwd: options?.cwd,
			env: { ...process.env, ...options?.env },
			shell: false,
		});

		let stdout = "";
		let stderr = "";

		proc.stdout?.on("data", (data) => {
			stdout += data.toString();
		});

		proc.stderr?.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("close", (code) => {
			resolve({
				stdout: stdout.trim(),
				stderr: stderr.trim(),
				exitCode: code ?? 1,
			});
		});

		proc.on("error", () => {
			resolve({
				stdout: stdout.trim(),
				stderr: stderr.trim(),
				exitCode: 1,
			});
		});

		if (options?.timeout) {
			setTimeout(() => {
				proc.kill();
				resolve({
					stdout: stdout.trim(),
					stderr: "Command timed out",
					exitCode: 124,
				});
			}, options.timeout);
		}
	});
}
