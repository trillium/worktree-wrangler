/**
 * Result type for explicit error handling
 * Inspired by Rust's Result<T, E> type
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
	readonly ok: true;
	readonly value: T;
}

export interface Failure<E> {
	readonly ok: false;
	readonly error: E;
}

export function success<T>(value: T): Success<T> {
	return { ok: true, value };
}

export function failure<E>(error: E): Failure<E> {
	return { ok: false, error };
}

/**
 * Specialized error types for domain-specific errors
 */

export class WorktreeNotFoundError extends Error {
	constructor(
		public readonly project: string,
		public readonly worktree: string,
	) {
		super(`Worktree not found: ${project}/${worktree}`);
		this.name = "WorktreeNotFoundError";
	}
}

export class ProjectNotFoundError extends Error {
	constructor(public readonly project: string) {
		super(`Project not found: ${project}`);
		this.name = "ProjectNotFoundError";
	}
}

export class PRNotFoundError extends Error {
	constructor(public readonly branch: string) {
		super(`No PR found for branch: ${branch}`);
		this.name = "PRNotFoundError";
	}
}

export class GitHubNotAuthenticatedError extends Error {
	constructor() {
		super("GitHub CLI is not authenticated. Run: gh auth login");
		this.name = "GitHubNotAuthenticatedError";
	}
}

export class InvalidConfigError extends Error {
	constructor(message: string) {
		super(`Invalid configuration: ${message}`);
		this.name = "InvalidConfigError";
	}
}

export class GitCommandError extends Error {
	constructor(
		message: string,
		public readonly stderr: string,
		public readonly exitCode: number,
	) {
		super(message);
		this.name = "GitCommandError";
	}
}

export class ScriptExecutionError extends Error {
	constructor(
		public readonly scriptPath: string,
		public readonly stderr: string,
		public readonly exitCode: number,
	) {
		super(`Script execution failed: ${scriptPath} (exit code ${exitCode})`);
		this.name = "ScriptExecutionError";
	}
}
