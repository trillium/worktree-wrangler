/**
 * GitHub PR-related type definitions
 */

export interface PullRequest {
	number: number;
	title: string;
	url: string;
	state: PRState;
	headRefName: string;
}

export enum PRState {
	OPEN = "OPEN",
	CLOSED = "CLOSED",
	MERGED = "MERGED",
}

export interface PRDiffStats {
	addedLines: number;
	removedLines: number;
	totalChanges: number;
}

export enum PRSize {
	ANT = "ant", // < 50
	MOUSE = "mouse", // < 150
	DOG = "dog", // < 600
	LION = "lion", // < 2000
	WHALE = "whale", // >= 2000
}

export const PR_SIZE_EMOJIS: Record<PRSize, string> = {
	[PRSize.ANT]: "🐜",
	[PRSize.MOUSE]: "🐭",
	[PRSize.DOG]: "🐕",
	[PRSize.LION]: "🦁",
	[PRSize.WHALE]: "🐋",
};

export const PR_SIZE_THRESHOLDS: Record<PRSize, number> = {
	[PRSize.ANT]: 50,
	[PRSize.MOUSE]: 150,
	[PRSize.DOG]: 600,
	[PRSize.LION]: 2000,
	[PRSize.WHALE]: Number.POSITIVE_INFINITY,
};

export function calculatePRSize(totalChanges: number): PRSize {
	if (totalChanges < PR_SIZE_THRESHOLDS[PRSize.ANT]) return PRSize.ANT;
	if (totalChanges < PR_SIZE_THRESHOLDS[PRSize.MOUSE]) return PRSize.MOUSE;
	if (totalChanges < PR_SIZE_THRESHOLDS[PRSize.DOG]) return PRSize.DOG;
	if (totalChanges < PR_SIZE_THRESHOLDS[PRSize.LION]) return PRSize.LION;
	return PRSize.WHALE;
}
