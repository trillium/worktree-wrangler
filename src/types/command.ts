/**
 * Command-related type definitions
 */

import type { WorktreeWranglerConfig } from "./config.ts";

export interface Command {
	execute(): Promise<number>; // Exit code
}

export interface CommandContext {
	args: string[];
	config: WorktreeWranglerConfig;
	cwd: string;
}

export type CommandHandler = (ctx: CommandContext) => Promise<number>;

export interface ParsedCommand {
	type: CommandType;
	args: string[];
	options: Record<string, string | boolean>;
}

export enum CommandType {
	HELP = "help",
	VERSION = "version",
	LIST = "list",
	STATUS = "status",
	RECENT = "recent",
	REMOVE = "remove",
	CLEANUP = "cleanup",
	COPY_PR_LINK = "copy-pr-link",
	CONFIG = "config",
	UPDATE = "update",
	WORKTREE = "worktree",
	BASE_REPO = "base-repo",
	SETUP_SCRIPT = "setup-script",
	ARCHIVE_SCRIPT = "archive-script",
}
