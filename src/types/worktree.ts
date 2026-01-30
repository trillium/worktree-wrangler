/**
 * Worktree-related type definitions
 */

export interface WorktreeInfo {
	name: string;
	path: string;
	project: string;
	branch: string;
	status: WorktreeStatus;
	lastActivity: Date;
}

export interface WorktreeStatus {
	clean: boolean;
	modifiedFiles: number;
	aheadCount: number;
	behindCount: number;
}

export interface WorktreeLocation {
	project: string;
	worktree: string;
	path: string;
	type: "legacy" | "standard" | "nested";
}

export interface CreateWorktreeOptions {
	project: string;
	name: string;
	branch?: string;
	runSetupScript?: boolean;
}

export interface RemoveWorktreeOptions {
	project: string;
	name: string;
	force?: boolean;
	runArchiveScript?: boolean;
}

export interface RecentEntry {
	timestamp: Date;
	project: string;
	worktree: string;
	exists: boolean;
}
