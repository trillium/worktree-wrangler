/**
 * Configuration types for Worktree Wrangler
 */

export interface WorktreeWranglerConfig {
	projectsDir: string;
	worktreesDir: string;
}

export interface PerRepositoryConfig {
	setupScript?: string;
	archiveScript?: string;
}

export interface ConfigFile {
	projects_dir?: string;
}

export function getDefaultConfig(): WorktreeWranglerConfig {
	const homeDir = process.env.HOME || process.env.USERPROFILE || "~";
	const projectsDir = `${homeDir}/development`;

	return {
		projectsDir,
		worktreesDir: `${projectsDir}/worktrees`,
	};
}

export const CONFIG_FILE_PATH = `${process.env.HOME || "~"}/.local/share/worktree-wrangler/config`;
export const REPOS_CONFIG_DIR = `${process.env.HOME || "~"}/.local/share/worktree-wrangler/repos`;
export const RECENT_FILE_PATH = `${process.env.HOME || "~"}/.local/share/worktree-wrangler/recent`;
