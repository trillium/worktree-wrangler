# Worktree Wrangler TypeScript Port - Design Document

## Executive Summary

This document provides a comprehensive analysis of the Worktree Wrangler zsh script and outlines the architecture for porting it to TypeScript. The goal is to create a more testable, maintainable, and type-safe implementation while preserving all existing functionality.

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Function Inventory](#function-inventory)
3. [TypeScript Architecture Design](#typescript-architecture-design)
4. [Module Structure](#module-structure)
5. [Type Definitions](#type-definitions)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [Migration Path](#migration-path)

---

## Current Architecture Analysis

### Overview

Worktree Wrangler is a single zsh function (`w()`) with approximately 1,514 lines of code that manages Git worktrees across multiple projects. It includes:

- **Configuration management** (file-based, key=value format)
- **Worktree lifecycle management** (create, remove, switch)
- **GitHub integration** (PR detection, cleanup, link copying)
- **Multiple directory structure support** (flat, nested, legacy)
- **Per-repository automation scripts** (setup and archive hooks)
- **Recent usage tracking**
- **Auto-update mechanism**

### Key Design Patterns

1. **Monolithic function** - All logic in one large function
2. **Helper functions** - Nested helper functions for specific tasks
3. **Multiple fallback strategies** - Robust PR detection with 4 different methods
4. **File-based persistence** - Configuration and tracking via plain text files
5. **Git command execution** - Heavy reliance on git CLI
6. **GitHub CLI integration** - Uses `gh` command for PR operations

---

## Function Inventory

### Main Entry Point

#### `w()` - Lines 8-1514
**Purpose**: Main function that routes commands and manages worktrees

**Responsibilities**:
- Parse command-line arguments
- Route to appropriate sub-functions
- Handle error cases
- Provide help/version information

**Inputs**: Command-line arguments (project, worktree, commands, flags)

**Outputs**: Exit codes, console output, directory changes

---

### Configuration Functions

#### `load_configuration()` - Lines 26-33
**Purpose**: Load user configuration from file

**Logic**:
- Default: `$HOME/development`
- Reads from `$HOME/.local/share/worktree-wrangler/config`
- Parses `key=value` format

**Returns**: Sets `$projects_dir` variable

---

#### `get_repo_script()` - Lines 36-44
**Purpose**: Retrieve per-repository script path

**Inputs**:
- `repo_name`: Name of the repository
- `script_type`: Either `"setup_script"` or `"archive_script"`

**Returns**: Script path if configured, empty string otherwise

**File location**: `$HOME/.local/share/worktree-wrangler/repos/{repo_name}.{script_type}`

---

### Project Management Functions

#### `list_valid_projects()` - Lines 47-55
**Purpose**: Find all valid Git repositories in projects directory

**Logic**:
- Checks flat structure: `$projects_dir/*/​.git`
- Checks nested structure: `$projects_dir/*/$project_name/.git`

**Returns**: List of project names (basenames)

---

#### `resolve_project_root()` - Lines 147-158
**Purpose**: Resolve absolute path to a project's Git repository

**Inputs**: `project_name`

**Returns**: Absolute path to Git repository or empty string

**Supported structures**:
1. Flat: `$projects_dir/$project_name/.git`
2. Nested: `$projects_dir/$project_name/$project_name/.git`

---

### Worktree Management Functions

#### `find_worktree_path()` - Lines 173-198
**Purpose**: Locate worktree directory across multiple possible locations

**Inputs**:
- `project`: Project name
- `worktree`: Worktree name

**Search order**:
1. Legacy core location: `$projects_dir/core-wts/$worktree`
2. New location: `$worktrees_dir/$project/$worktree`
3. Nested structure: `$projects_dir/$project/$worktree`

**Returns**: Absolute path to worktree or empty string

---

#### `resolve_main_repo_from_worktree()` - Lines 161-170
**Purpose**: Find main repository from a worktree path

**Inputs**: `worktree_path`

**Logic**: Uses `git rev-parse --git-common-dir` to find shared .git directory

**Returns**: Parent directory of common git directory

---

#### `get_worktree_info()` - Lines 98-144
**Purpose**: Extract comprehensive information about a worktree

**Inputs**: `wt_path` (worktree path)

**Returns**: Pipe-delimited string: `branch_name|status_info|last_activity`

**Collected information**:
- Branch name (or "(detached)")
- Modified files count
- Ahead/behind counts
- Last commit time (relative)

**Example output**: `feature/auth|📝 3 files, ↑2|5 hours ago`

---

### Script Hook Functions

#### `run_archive_script()` - Lines 60-95
**Purpose**: Execute archive script before worktree removal

**Inputs**:
- `project`: Project name
- `worktree_name`: Worktree name
- `worktree_path`: Full path to worktree

**Environment variables provided to script**:
- `W_WORKSPACE_NAME`: Worktree name
- `W_WORKSPACE_PATH`: Full path to worktree
- `W_ROOT_PATH`: Path to main repository
- `W_DEFAULT_BRANCH`: Default branch (main/master)

**Exit handling**: Reports success or failure but continues regardless

---

#### Setup Script Execution - Lines 1438-1467
**Purpose**: Execute setup script after worktree creation

**Location**: Inline in main worktree creation logic

**Same environment variables as archive script**

**Exit handling**: Reports status but doesn't fail worktree creation

---

### Recent Usage Tracking

#### `track_recent_usage()` - Lines 1471-1494
**Purpose**: Track worktree usage for `--recent` command

**Inputs**:
- `project`: Project name
- `worktree`: Worktree name

**File format**: `timestamp|project|worktree` (one per line)

**Logic**:
- Removes existing entry for this worktree
- Appends new entry with current timestamp
- Keeps only last 50 entries

---

### GitHub Integration Functions

#### PR Detection (Multiple Methods) - Lines 572-643
**Purpose**: Robustly detect GitHub PR for a branch using multiple fallback methods

**Method 1 (Lines 576-581)**: Branch format matching
- Tries: `branch`, `origin/branch`, `short-branch`
- Uses: `gh pr list --head "$branch_format"`

**Method 2 (Lines 584-586)**: Context-aware from worktree
- Uses: `gh pr status` run from worktree directory

**Method 3 (Lines 589-607)**: All PRs filtering
- Gets all PRs: `gh pr list`
- Filters with jq for exact, partial, and username-stripped matches

**Method 4 (Lines 610-615)**: Commit-based lookup
- Gets current commit SHA
- Searches: `gh pr list --search "sha:$commit"`

**Returns**: JSON PR information or empty string

---

#### PR Info Parsing - Lines 624-638
**Purpose**: Extract PR state from different JSON response formats

**Handles three formats**:
1. `gh pr status` format: `.currentBranch.state`
2. Array format: `.[0].state`
3. Single object format: `.state`

**Returns**: PR state (MERGED, OPEN, CLOSED, etc.)

---

#### `cleanup_worktree()` - Lines 542-657
**Purpose**: Remove a single worktree if its PR is merged

**Checks performed** (in order):
1. Can resolve main repository
2. Can determine branch name
3. No uncommitted changes
4. Has associated PR (using robust PR detection)
5. PR state is MERGED
6. No unpushed commits

**Actions**:
- Runs archive script
- Removes worktree via `git worktree remove`
- Increments cleanup counter

---

### Command Handlers

#### `--list` Command - Lines 201-309
**Purpose**: Display all worktrees across all projects

**Output sections**:
1. Configuration info (projects dir, worktrees dir)
2. New location worktrees (`$worktrees_dir/$project/*`)
3. Legacy core location (`$projects_dir/core-wts/*`)
4. Nested structure worktrees (`$projects_dir/$project/*`)

**Display format**:
- Project headers with emojis
- Worktree bullet points with status info
- Color-coded output
- Helpful hints if no worktrees found

---

#### `--status [project]` Command - Lines 310-383
**Purpose**: Show git status for all worktrees (or specific project)

**Logic**:
- Iterates through all worktrees
- Filters by project if specified
- Only displays worktrees with uncommitted changes
- Shows `git status --short` output

---

#### `--recent` Command - Lines 384-445
**Purpose**: Display recently used worktrees

**Logic**:
- Reads recent file in reverse (newest first)
- Shows last 10 entries
- Converts timestamps to human-readable format
- Shows current worktree info if still exists
- Marks deleted worktrees

---

#### `--rm <project> <worktree> [--force]` Command - Lines 446-521
**Purpose**: Remove a specific worktree

**Features**:
- Validates worktree exists (searches all locations)
- Runs archive script before removal
- Supports `--force` / `-f` flag for dirty worktrees
- Provides helpful error messages with file lists
- Suggests force flag if needed

**Flow**:
1. Parse arguments and flags
2. Find worktree path
3. Resolve main repository
4. Run archive script
5. Attempt `git worktree remove`
6. Handle errors (especially modified files)

---

#### `--cleanup` Command - Lines 522-700
**Purpose**: Automatically remove all merged PR worktrees

**Logic**:
- Iterates all projects with Git repos
- For each project, checks all worktree locations
- Uses `cleanup_worktree()` helper for each
- Tracks counts: checked and cleaned

**Safety features**:
- Requires GitHub CLI authentication
- Multiple validation checks per worktree
- Never removes worktrees with uncommitted changes
- Never removes worktrees with unpushed commits

---

#### `--copy-pr-link [project] [worktree]` Command - Lines 701-937
**Purpose**: Copy formatted PR markdown link with size-based emoji

**Modes**:
1. **With arguments**: Specific project/worktree
2. **Without arguments**: Current working directory

**Features**:
- Robust PR detection (reuses detection logic)
- Calculates diff size (added + removed lines)
- Selects emoji based on size:
  - 🐜 ant: < 50 lines
  - 🐭 mouse: < 150 lines
  - 🐕 dog: < 600 lines
  - 🦁 lion: < 2000 lines
  - 🐋 whale: ≥ 2000 lines

**Output format**: `{emoji} [PR Title](PR URL)`

**Clipboard support**: pbcopy (macOS), xclip (Linux), wl-copy (Wayland)

---

#### `--help` Command - Lines 938-993
**Purpose**: Display comprehensive help documentation

**Sections**:
- Usage examples
- Configuration options
- Per-repository scripts
- Script environment variables
- Practical examples
- Other commands

---

#### `--version` Command - Lines 994-996
**Purpose**: Display current version number

---

#### `--update` Command - Lines 997-1052
**Purpose**: Self-update to latest version from GitHub

**Logic**:
1. Download latest from raw GitHub URL
2. Extract version from downloaded file
3. Compare with current version
4. Create timestamped backup
5. Replace current script
6. Instruct user to reload shell

---

#### `--config` Command - Lines 1053-1179
**Purpose**: Manage configuration settings

**Subcommands**:

##### `--config projects <path>` - Lines 1071-1094
- Set projects directory
- Validates directory exists
- Expands tilde and resolves path
- Stores in config file

##### `--config list` - Lines 1117-1159
- Shows current configuration
- Lists per-repository scripts
- Provides helpful hints

##### `--config reset` - Lines 1160-1168
- Removes config file
- Reverts to defaults

##### `--config setup_script` - Lines 1095-1105
- DEPRECATED: Shows migration message to per-repo scripts

##### `--config archive_script` - Lines 1106-1116
- DEPRECATED: Shows migration message to per-repo scripts

---

#### Per-Repository Script Configuration

##### `w <repo> --setup_script <path>` - Lines 1217-1280
**Purpose**: Configure setup script for specific repository

**Validation**:
- Repository exists in projects directory
- Script file exists
- Script is executable

**Clear script**: `w <repo> --setup_script ""`

**Storage**: `$HOME/.local/share/worktree-wrangler/repos/{repo}.setup_script`

---

##### `w <repo> --archive_script <path>` - Lines 1281-1344
**Purpose**: Configure archive script for specific repository

**Same validation and storage as setup_script**

---

#### Base Repository Operations: `w <project> - [command]` - Lines 1183-1214
**Purpose**: Operate on base repository instead of worktree

**Modes**:
1. **No command**: Change directory to base repository
2. **With command**: Execute command in base repository, return to original directory

**Example**: `w myproject - git status`

---

#### Main Worktree Operation: `w <project> <worktree> [command]` - Lines 1347-1512
**Purpose**: Switch to or create worktree, optionally running a command

**Flow**:

1. **Validation** (Lines 1379-1401)
   - Projects directory exists
   - Project exists
   - List available projects if not found

2. **Worktree Lookup** (Lines 1403-1417)
   - Search all possible locations
   - Prefer legacy location for "core" project

3. **Worktree Creation** (Lines 1421-1467)
   - Create if doesn't exist
   - Branch naming: `$USER/$worktree`
   - Run setup script if configured
   - Report success/failure

4. **Usage Tracking** (Lines 1496-1497)
   - Track in recent file

5. **Execution** (Lines 1499-1511)
   - **No command**: Change directory to worktree
   - **With command**: Execute in worktree, return to original directory

---

### Utility Functions (Implicit)

#### Color Management - Lines 10-20
**Purpose**: Define ANSI color codes for terminal output

**Colors defined**:
- RED, GREEN, YELLOW, BLUE, PURPLE, CYAN, WHITE
- BOLD, DIM, NC (No Color)

---

## TypeScript Architecture Design

### Design Principles

1. **Separation of Concerns**: Break monolithic function into focused modules
2. **Dependency Injection**: Make external dependencies (git, gh, fs) injectable for testing
3. **Type Safety**: Leverage TypeScript's type system for configuration, commands, and data structures
4. **Testability**: Pure functions where possible, mockable I/O operations
5. **Error Handling**: Explicit error types and result types
6. **Async/Await**: Modern async patterns for command execution
7. **Immutability**: Prefer immutable data structures

---

## Module Structure

```
src/
├── index.ts                    # CLI entry point
├── types/                      # Type definitions
│   ├── config.ts              # Configuration types
│   ├── worktree.ts            # Worktree data types
│   ├── github.ts              # GitHub PR types
│   ├── command.ts             # Command types
│   └── result.ts              # Result/Error types
├── config/                     # Configuration management
│   ├── ConfigManager.ts       # Config read/write/validation
│   ├── ScriptManager.ts       # Per-repo script management
│   └── defaults.ts            # Default configuration values
├── git/                        # Git operations
│   ├── GitClient.ts           # Git command wrapper
│   ├── WorktreeManager.ts     # Worktree CRUD operations
│   └── RepositoryResolver.ts  # Project path resolution
├── github/                     # GitHub integration
│   ├── GitHubClient.ts        # GitHub CLI wrapper
│   ├── PRDetector.ts          # Multi-method PR detection
│   ├── PRParser.ts            # JSON response parsing
│   └── PRLinkFormatter.ts     # Emoji sizing and formatting
├── commands/                   # Command handlers
│   ├── CommandRouter.ts       # Route to appropriate handler
│   ├── ListCommand.ts         # --list handler
│   ├── StatusCommand.ts       # --status handler
│   ├── RecentCommand.ts       # --recent handler
│   ├── RemoveCommand.ts       # --rm handler
│   ├── CleanupCommand.ts      # --cleanup handler
│   ├── CopyPRLinkCommand.ts   # --copy-pr-link handler
│   ├── ConfigCommand.ts       # --config handler
│   ├── HelpCommand.ts         # --help handler
│   ├── VersionCommand.ts      # --version handler
│   ├── UpdateCommand.ts       # --update handler
│   └── WorktreeCommand.ts     # Main worktree switch/create
├── tracking/                   # Usage tracking
│   ├── RecentTracker.ts       # Recent worktree usage
│   └── TrackerStorage.ts      # File-based storage
├── scripts/                    # Script execution
│   ├── ScriptExecutor.ts      # Run setup/archive scripts
│   └── ScriptEnvironment.ts   # Environment variable setup
├── ui/                         # User interface
│   ├── OutputFormatter.ts     # Colored terminal output
│   ├── TableFormatter.ts      # Table/list formatting
│   └── ErrorFormatter.ts      # User-friendly error messages
└── utils/                      # Shared utilities
    ├── exec.ts                # Command execution helpers
    ├── filesystem.ts          # File system helpers
    ├── clipboard.ts           # Cross-platform clipboard
    └── validation.ts          # Input validation
```

---

## Type Definitions

### Configuration Types

```typescript
// types/config.ts

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

export const DEFAULT_CONFIG: WorktreeWranglerConfig = {
  projectsDir: `${process.env.HOME}/development`,
  get worktreesDir() {
    return `${this.projectsDir}/worktrees`;
  },
};
```

### Worktree Types

```typescript
// types/worktree.ts

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
  type: 'legacy' | 'standard' | 'nested';
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
```

### GitHub Types

```typescript
// types/github.ts

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  state: PRState;
  headRefName: string;
}

export enum PRState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  MERGED = 'MERGED',
}

export interface PRDiffStats {
  addedLines: number;
  removedLines: number;
  totalChanges: number;
}

export enum PRSize {
  ANT = 'ant',      // < 50
  MOUSE = 'mouse',  // < 150
  DOG = 'dog',      // < 600
  LION = 'lion',    // < 2000
  WHALE = 'whale',  // >= 2000
}

export const PR_SIZE_EMOJIS: Record<PRSize, string> = {
  [PRSize.ANT]: '🐜',
  [PRSize.MOUSE]: '🐭',
  [PRSize.DOG]: '🐕',
  [PRSize.LION]: '🦁',
  [PRSize.WHALE]: '🐋',
};
```

### Result Types

```typescript
// types/result.ts

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  ok: true;
  value: T;
}

export interface Failure<E> {
  ok: false;
  error: E;
}

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}

// Specialized error types
export class WorktreeNotFoundError extends Error {
  constructor(public project: string, public worktree: string) {
    super(`Worktree not found: ${project}/${worktree}`);
    this.name = 'WorktreeNotFoundError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor(public project: string) {
    super(`Project not found: ${project}`);
    this.name = 'ProjectNotFoundError';
  }
}

export class PRNotFoundError extends Error {
  constructor(public branch: string) {
    super(`No PR found for branch: ${branch}`);
    this.name = 'PRNotFoundError';
  }
}

export class GitHubNotAuthenticatedError extends Error {
  constructor() {
    super('GitHub CLI is not authenticated. Run: gh auth login');
    this.name = 'GitHubNotAuthenticatedError';
  }
}
```

### Command Types

```typescript
// types/command.ts

export interface Command {
  execute(): Promise<number>; // Exit code
}

export interface CommandContext {
  args: string[];
  config: WorktreeWranglerConfig;
  cwd: string;
}

export type CommandHandler = (ctx: CommandContext) => Promise<number>;
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Tasks**:
1. Set up TypeScript project structure
2. Configure build tooling (esbuild/tsc)
3. Implement type definitions
4. Create base interfaces and abstract classes
5. Implement utility modules (exec, filesystem, validation)

**Deliverables**:
- Compiled TypeScript setup
- All type definitions
- Basic utility functions with tests

---

### Phase 2: Configuration & Git Layer (Week 2)

**Tasks**:
1. Implement `ConfigManager` with file I/O
2. Implement `ScriptManager` for per-repo scripts
3. Implement `GitClient` wrapper
4. Implement `RepositoryResolver` for path resolution
5. Implement `WorktreeManager` for CRUD operations

**Deliverables**:
- Functional configuration system
- Git worktree operations
- Unit tests for all modules

---

### Phase 3: GitHub Integration (Week 3)

**Tasks**:
1. Implement `GitHubClient` wrapper for `gh` CLI
2. Implement `PRDetector` with all 4 detection methods
3. Implement `PRParser` for JSON response handling
4. Implement `PRLinkFormatter` with emoji sizing
5. Add integration tests with mock GitHub responses

**Deliverables**:
- Complete GitHub integration
- PR detection with fallbacks
- Tests with fixtures

---

### Phase 4: Command Handlers (Week 4-5)

**Tasks**:
1. Implement `CommandRouter` with argument parsing
2. Implement all command classes:
   - `ListCommand`
   - `StatusCommand`
   - `RecentCommand`
   - `RemoveCommand`
   - `CleanupCommand`
   - `CopyPRLinkCommand`
   - `ConfigCommand`
   - `HelpCommand`
   - `VersionCommand`
   - `UpdateCommand`
   - `WorktreeCommand`
3. Add comprehensive tests for each command

**Deliverables**:
- All commands implemented
- Feature parity with zsh version
- Command tests

---

### Phase 5: UI & Polish (Week 6)

**Tasks**:
1. Implement `OutputFormatter` with color support
2. Implement `TableFormatter` for list displays
3. Implement `ErrorFormatter` for user-friendly errors
4. Add clipboard support (cross-platform)
5. Polish error messages and help text

**Deliverables**:
- Beautiful terminal output
- Helpful error messages
- Cross-platform clipboard

---

### Phase 6: Testing & Documentation (Week 7)

**Tasks**:
1. Integration tests for all workflows
2. End-to-end tests with real git repos (in temp dirs)
3. Performance benchmarking vs zsh version
4. Write comprehensive documentation
5. Create migration guide

**Deliverables**:
- >90% test coverage
- Performance report
- Complete documentation
- Migration guide

---

### Phase 7: Release & Migration (Week 8)

**Tasks**:
1. Create binary distribution (using pkg or similar)
2. Update installation scripts
3. Create compatibility layer (both versions work)
4. Soft launch to beta users
5. Gather feedback and fix issues

**Deliverables**:
- Installable binary
- Updated documentation
- Beta release
- Feedback incorporated

---

## Testing Strategy

### Unit Tests

**Framework**: Jest or Vitest

**Coverage targets**:
- All pure functions: 100%
- Command handlers: >90%
- Utilities: 100%
- Type guards: 100%

**Mock strategy**:
- Mock file system operations
- Mock git command execution
- Mock GitHub CLI calls
- Use dependency injection for all external dependencies

**Example**:
```typescript
describe('PRDetector', () => {
  it('should detect PR using branch name method', async () => {
    const mockGitHub = {
      exec: jest.fn().mockResolvedValue({
        stdout: JSON.stringify([{
          number: 123,
          state: 'MERGED',
          title: 'Test PR',
          url: 'https://github.com/...'
        }])
      })
    };

    const detector = new PRDetector(mockGitHub);
    const result = await detector.detectPR('feature-branch');

    expect(result.ok).toBe(true);
    expect(result.value?.number).toBe(123);
  });
});
```

---

### Integration Tests

**Scope**: Multi-module workflows

**Test scenarios**:
1. Complete worktree creation workflow
2. PR cleanup workflow
3. Configuration change workflow
4. Script execution workflow

**Setup**: Use temporary directories and real git commands (not mocked)

---

### End-to-End Tests

**Scope**: Full CLI execution

**Test scenarios**:
1. `w project worktree` - create and switch
2. `w --list` - display all worktrees
3. `w --cleanup` - cleanup merged PRs
4. `w --rm project worktree` - remove worktree
5. Error scenarios (missing project, etc.)

**Setup**: Spawn actual CLI process, verify output and side effects

---

### Performance Tests

**Benchmarks**:
1. Startup time (cold and warm)
2. List operation (100+ worktrees)
3. PR detection (all 4 methods)
4. Cleanup operation (50+ worktrees)

**Target**: Performance within 10% of zsh version

---

## Migration Path

### Compatibility Approach

**Option 1: Drop-in Replacement**
- Same command name: `w`
- Same arguments and flags
- Same output format
- Same configuration files

**Option 2: Side-by-side**
- New command name: `wt` or `worktree-wrangler`
- Gradual migration
- Both versions work during transition
- Deprecation notices in old version

**Recommendation**: Option 1 (drop-in replacement) for simplicity

---

### Installation Strategy

**Binary distribution**:
- Use `pkg` or `esbuild` to create standalone binary
- Support: macOS (arm64, x64), Linux (x64)
- No Node.js required for end users

**Installation script update**:
```bash
# New install.sh
curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash

# Downloads appropriate binary
# Installs to ~/.local/bin/w
# Updates shell integration
```

---

### Configuration Migration

**Automatic migration**:
- Detect existing config files
- Convert if needed (currently same format)
- No user action required

**Per-repo scripts**:
- No changes needed
- File paths remain the same

---

### Rollback Strategy

**Keep zsh version**:
- Rename to `w.zsh.backup`
- Provide rollback command
- Document rollback process

**Rollback command**:
```bash
w --rollback-to-zsh
# Or manual:
mv ~/.local/bin/w.zsh.backup ~/.local/bin/w
```

---

## Key Implementation Details

### Dependency Injection Pattern

```typescript
// Example: GitClient
export interface GitExecutor {
  exec(command: string[], cwd: string): Promise<ExecResult>;
}

export class GitClient {
  constructor(private executor: GitExecutor) {}

  async getCurrentBranch(repoPath: string): Promise<Result<string>> {
    const result = await this.executor.exec(
      ['git', 'branch', '--show-current'],
      repoPath
    );

    if (result.exitCode !== 0) {
      return failure(new Error(result.stderr));
    }

    return success(result.stdout.trim());
  }
}
```

---

### Result Type Pattern

```typescript
// Instead of throwing exceptions
async function createWorktree(
  options: CreateWorktreeOptions
): Promise<Result<WorktreeInfo>> {
  const projectResult = await resolveProject(options.project);
  if (!projectResult.ok) {
    return projectResult; // Propagate error
  }

  const project = projectResult.value;

  // ... more operations

  return success(worktreeInfo);
}

// Usage
const result = await createWorktree({ project: 'myapp', name: 'feature' });
if (result.ok) {
  console.log('Created:', result.value.path);
} else {
  console.error('Failed:', result.error.message);
}
```

---

### Command Pattern

```typescript
export class ListCommand implements Command {
  constructor(
    private worktreeManager: WorktreeManager,
    private formatter: OutputFormatter
  ) {}

  async execute(): Promise<number> {
    const worktrees = await this.worktreeManager.listAll();

    if (worktrees.length === 0) {
      this.formatter.info('No worktrees found');
      this.formatter.hint('Create one: w <project> <worktree>');
      return 0;
    }

    this.formatter.heading('All Worktrees');

    for (const wt of worktrees) {
      this.formatter.worktreeItem(wt);
    }

    return 0;
  }
}
```

---

## Benefits of TypeScript Port

### For Development

1. **Type safety**: Catch errors at compile time
2. **Better IDE support**: Autocomplete, refactoring, go-to-definition
3. **Easier refactoring**: Compiler ensures consistency
4. **Self-documenting**: Types serve as inline documentation
5. **Modern tooling**: npm ecosystem, testing frameworks

### For Testing

1. **Dependency injection**: Easy to mock external dependencies
2. **Pure functions**: Easier to unit test
3. **Modular structure**: Test each module independently
4. **Test coverage tools**: nyc, c8 integration
5. **Snapshot testing**: For output formatting

### For Maintenance

1. **Clear module boundaries**: Easier to understand codebase
2. **Explicit contracts**: Interface definitions show expectations
3. **Error handling**: Type system enforces error handling
4. **Versioning**: npm semver for releases
5. **CI/CD integration**: Standard Node.js tooling

### For Users

1. **Cross-platform binary**: No shell dependencies
2. **Faster startup**: Compiled code vs interpreted shell script
3. **Better error messages**: Structured error handling
4. **Consistent behavior**: Same code on all platforms
5. **Auto-complete**: Can generate shell completions from types

---

## Challenges & Mitigations

### Challenge 1: Shell Integration

**Problem**: Current version changes shell directory with `cd`

**Mitigation**:
- Provide shell function wrapper that reads output
- Use special exit codes to signal directory change
- Output directory to stdout for wrapper to consume

**Example shell wrapper**:
```bash
w() {
  local output=$(worktree-wrangler "$@")
  local exit_code=$?

  # Check if output contains directory change directive
  if [[ "$output" == "CD:"* ]]; then
    cd "${output#CD:}"
  else
    echo "$output"
  fi

  return $exit_code
}
```

---

### Challenge 2: Git Command Execution

**Problem**: Many git commands return complex output

**Mitigation**:
- Create typed result parsers
- Use git plumbing commands where possible
- Comprehensive error handling

---

### Challenge 3: Performance

**Problem**: Node.js startup time overhead

**Mitigation**:
- Use esbuild for fast compilation
- Single-file binary with pkg
- Minimize dependencies
- Lazy load modules
- Cache configuration in memory

---

### Challenge 4: Cross-platform Compatibility

**Problem**: Different OS behaviors (paths, commands)

**Mitigation**:
- Use Node.js path module for cross-platform paths
- Abstract filesystem operations
- Test on macOS, Linux, Windows (WSL)
- Use cross-platform libraries (chalk for colors)

---

## Conclusion

This TypeScript port will transform Worktree Wrangler from a monolithic shell script into a modular, testable, and maintainable application. The architecture prioritizes:

- **Separation of concerns** via module boundaries
- **Type safety** via TypeScript's type system
- **Testability** via dependency injection and pure functions
- **User experience** via better error messages and cross-platform support

The implementation plan spreads work across 8 weeks with clear deliverables for each phase. The migration path ensures users can adopt the new version with minimal disruption.

The result will be a more robust, easier-to-understand codebase that maintains all existing functionality while enabling future enhancements.
