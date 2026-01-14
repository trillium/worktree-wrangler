#!/usr/bin/env bats

# Force Removal Feature Test Suite
# Tests the --force/-f flag for w --rm command

# Setup and teardown
setup() {
    # Source the test environment setup
    export ORIGINAL_HOME="$HOME"

    # Create unique test environment for this test
    export TEST_HOME="/tmp/worktree-wrangler-test-$$-$BATS_TEST_NUMBER"
    export HOME="$TEST_HOME"
    export TEST_PROJECTS="$TEST_HOME/projects"

    # Create test directories
    mkdir -p "$TEST_PROJECTS"
    mkdir -p "$TEST_HOME/.local/share/worktree-wrangler"

    # Copy worktree-wrangler script to test environment
    cp "$BATS_TEST_DIRNAME/../worktree-wrangler.zsh" "$TEST_HOME/"

    # Create a helper function to run w commands in zsh
    w() {
        zsh -c "source '$TEST_HOME/worktree-wrangler.zsh'; w $*"
    }

    # Create test git repo
    mkdir -p "$TEST_PROJECTS/testproject"
    cd "$TEST_PROJECTS/testproject"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Test Project" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"

    # Configure w to use test projects directory
    w --config projects "$TEST_PROJECTS"
}

teardown() {
    # Clean up test environment
    export HOME="$ORIGINAL_HOME"
    rm -rf "$TEST_HOME" 2>/dev/null || true
}

# Basic Force Removal Tests

@test "w --rm without --force fails on dirty worktree" {
    # Create worktree
    w testproject feature1

    # Add untracked file to make it dirty
    echo "test content" > "$TEST_PROJECTS/worktrees/testproject/feature1/untracked.txt"

    # Try to remove without --force
    run w --rm testproject feature1
    [ "$status" -eq 1 ]
    [[ "$output" == *"Error: Worktree contains modifications"* ]]

    # Verify worktree still exists
    [ -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

@test "w --rm --force removes dirty worktree with untracked files" {
    # Create worktree
    w testproject feature1

    # Add untracked file
    echo "test content" > "$TEST_PROJECTS/worktrees/testproject/feature1/untracked.txt"

    # Remove with --force
    run w --rm testproject feature1 --force
    [ "$status" -eq 0 ]

    # Verify worktree was removed
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

@test "w --rm -f removes dirty worktree with untracked files (short flag)" {
    # Create worktree
    w testproject feature1

    # Add untracked file
    echo "test content" > "$TEST_PROJECTS/worktrees/testproject/feature1/untracked.txt"

    # Remove with -f (short form)
    run w --rm testproject feature1 -f
    [ "$status" -eq 0 ]

    # Verify worktree was removed
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

@test "w --rm --force removes dirty worktree with modified files" {
    # Create worktree
    w testproject feature1

    # Modify tracked file
    echo "modified content" >> "$TEST_PROJECTS/worktrees/testproject/feature1/README.md"

    # Remove with --force
    run w --rm testproject feature1 --force
    [ "$status" -eq 0 ]

    # Verify worktree was removed
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

@test "w --rm without --force still works on clean worktree" {
    # Create worktree
    w testproject feature1

    # Don't modify anything - worktree is clean

    # Remove without --force
    run w --rm testproject feature1
    [ "$status" -eq 0 ]

    # Verify worktree was removed
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

# Error Message Tests

@test "w --rm shows modified files in error message" {
    # Create worktree
    w testproject feature1

    # Modify tracked file
    echo "modified" >> "$TEST_PROJECTS/worktrees/testproject/feature1/README.md"

    # Try to remove without --force
    run w --rm testproject feature1
    [ "$status" -eq 1 ]
    [[ "$output" == *"Modified or untracked files:"* ]]
    [[ "$output" == *"README.md"* ]]
}

@test "w --rm shows untracked files in error message" {
    # Create worktree
    w testproject feature1

    # Add untracked file
    echo "test" > "$TEST_PROJECTS/worktrees/testproject/feature1/newfile.txt"

    # Try to remove without --force
    run w --rm testproject feature1
    [ "$status" -eq 1 ]
    [[ "$output" == *"Modified or untracked files:"* ]]
    [[ "$output" == *"newfile.txt"* ]]
}

@test "w --rm suggests using --force in error message" {
    # Create worktree
    w testproject feature1

    # Make it dirty
    echo "test" > "$TEST_PROJECTS/worktrees/testproject/feature1/newfile.txt"

    # Try to remove without --force
    run w --rm testproject feature1
    [ "$status" -eq 1 ]
    [[ "$output" == *"Use --force to remove anyway:"* ]]
    [[ "$output" == *"w --rm testproject feature1 --force"* ]]
}

# Edge Cases

@test "w --rm with invalid flag shows error" {
    # Create worktree
    w testproject feature1

    # Try with invalid flag
    run w --rm testproject feature1 --invalid
    [ "$status" -eq 1 ]
    [[ "$output" == *"Unknown option: --invalid"* ]]
}

@test "w --rm --force on nonexistent worktree shows error" {
    run w --rm testproject nonexistent --force
    [ "$status" -eq 1 ]
    [[ "$output" == *"Worktree not found"* ]]
}

@test "w --rm --force works with setup script-created files" {
    # Create worktree
    w testproject feature1

    # Simulate setup script creating files (node_modules, .env, etc.)
    mkdir -p "$TEST_PROJECTS/worktrees/testproject/feature1/node_modules"
    echo "dependency" > "$TEST_PROJECTS/worktrees/testproject/feature1/node_modules/package.json"
    echo "SECRET=123" > "$TEST_PROJECTS/worktrees/testproject/feature1/.env"

    # Should be able to force remove
    run w --rm testproject feature1 --force
    [ "$status" -eq 0 ]
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

# Help Text Tests

@test "w --help shows --force flag in --rm usage" {
    run w --help
    [ "$status" -eq 0 ]
    [[ "$output" == *"w --rm <project> <worktree> [-f|--force]"* ]]
}

@test "w without args shows --force flag in usage" {
    run w
    [ "$status" -eq 1 ]
    [[ "$output" == *"w --rm <project> <worktree> [-f|--force]"* ]]
}

# Multiple Files Test

@test "w --rm --force removes worktree with multiple untracked files" {
    # Create worktree
    w testproject feature1

    # Add multiple untracked files
    echo "file1" > "$TEST_PROJECTS/worktrees/testproject/feature1/file1.txt"
    echo "file2" > "$TEST_PROJECTS/worktrees/testproject/feature1/file2.txt"
    echo "file3" > "$TEST_PROJECTS/worktrees/testproject/feature1/file3.txt"

    # Remove with --force
    run w --rm testproject feature1 --force
    [ "$status" -eq 0 ]
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

@test "w --rm --force removes worktree with mix of modified and untracked files" {
    # Create worktree
    w testproject feature1

    # Modify tracked file
    echo "modified" >> "$TEST_PROJECTS/worktrees/testproject/feature1/README.md"

    # Add untracked files
    echo "new" > "$TEST_PROJECTS/worktrees/testproject/feature1/newfile.txt"

    # Remove with --force
    run w --rm testproject feature1 --force
    [ "$status" -eq 0 ]
    [ ! -d "$TEST_PROJECTS/worktrees/testproject/feature1" ]
}

# Version Check

@test "version number updated to 1.7.0" {
    run w --version
    [ "$status" -eq 0 ]
    [[ "$output" == *"1.7.0"* ]]
}
