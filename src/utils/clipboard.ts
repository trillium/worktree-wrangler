/**
 * Cross-platform clipboard utilities
 */

import type { Result } from "../types/result.ts";
import { failure, success } from "../types/result.ts";
import { executeCommand } from "./exec.ts";

/**
 * Detect which clipboard command is available
 */
async function detectClipboardCommand(): Promise<string | null> {
	const commands = ["pbcopy", "xclip", "wl-copy", "clip"];

	for (const cmd of commands) {
		const result = await executeCommand("which", [cmd]);
		if (result.ok) {
			return cmd;
		}
	}

	return null;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<Result<void>> {
	const command = await detectClipboardCommand();

	if (!command) {
		return failure(
			new Error(
				"No clipboard command available. Install pbcopy (macOS), xclip (Linux), or wl-copy (Wayland)",
			),
		);
	}

	try {
		let result: Result<string>;

		switch (command) {
			case "pbcopy":
				// macOS: pbcopy reads from stdin
				result = await executeCommandWithStdin("pbcopy", [], text);
				break;

			case "xclip":
				// Linux X11: xclip -selection clipboard
				result = await executeCommandWithStdin(
					"xclip",
					["-selection", "clipboard"],
					text,
				);
				break;

			case "wl-copy":
				// Linux Wayland: wl-copy
				result = await executeCommandWithStdin("wl-copy", [], text);
				break;

			case "clip":
				// Windows: clip
				result = await executeCommandWithStdin("clip", [], text);
				break;

			default:
				return failure(new Error(`Unknown clipboard command: ${command}`));
		}

		if (!result.ok) {
			return failure(result.error);
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
 * Helper to execute command with stdin
 */
async function executeCommandWithStdin(
	command: string,
	args: string[],
	stdin: string,
): Promise<Result<string>> {
	return new Promise((resolve) => {
		const { spawn } = require("node:child_process");
		const proc = spawn(command, args);

		let stderr = "";

		proc.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		proc.on("close", (code: number) => {
			if (code === 0) {
				resolve(success(""));
			} else {
				resolve(failure(new Error(`Command failed: ${stderr.trim()}`)));
			}
		});

		proc.on("error", (err: Error) => {
			resolve(failure(err));
		});

		// Write to stdin and close it
		proc.stdin?.write(stdin);
		proc.stdin?.end();
	});
}
