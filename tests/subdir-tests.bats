#!/usr/bin/env bats

# Worktree Wrangler T Subdir Tests
# Tests for nested project structure support

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
    
    # Configure w to use test projects directory
    w --config projects "$TEST_PROJECTS"
}

teardown() {
    # Clean up test environment
    export HOME="$ORIGINAL_HOME"
    rm -rf "$TEST_HOME" 2>/dev/null || true
}

@test "w works with nested project structure" {
    # Create nested project structure: testnested/testnested/.git
    mkdir -p "$TEST_PROJECTS/testnested/testnested"
    cd "$TEST_PROJECTS/testnested/testnested"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Nested Test Project" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Test creating worktree for nested project
    run w testnested nestedfeature
    [ "$status" -eq 0 ]
    
    # Verify worktree was created
    [ -d "$TEST_PROJECTS/worktrees/testnested/nestedfeature" ]
    
    # Verify it's a git worktree
    [ -e "$TEST_PROJECTS/worktrees/testnested/nestedfeature/.git" ]
    
    # Test listing shows the nested project
    run w --list
    [ "$status" -eq 0 ]
    [[ "$output" == *"[testnested]"* ]]
    [[ "$output" == *"nestedfeature"* ]]
}

@test "w --rm works with nested project structure" {
    # Create nested project structure: testrm/testrm/.git
    mkdir -p "$TEST_PROJECTS/testrm/testrm"
    cd "$TEST_PROJECTS/testrm/testrm"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Nested Test Project for RM" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Create worktree for nested project
    run w testrm rmfeature
    [ "$status" -eq 0 ]
    [ -d "$TEST_PROJECTS/worktrees/testrm/rmfeature" ]
    
    # Remove the worktree
    run w --rm testrm rmfeature
    [ "$status" -eq 0 ]
    
    # Verify worktree was removed
    [ ! -d "$TEST_PROJECTS/worktrees/testrm/rmfeature" ]
}

@test "w --list shows worktrees in nested project structures" {
    # Create nested project structure: testlist/testlist/.git
    mkdir -p "$TEST_PROJECTS/testlist/testlist"
    cd "$TEST_PROJECTS/testlist/testlist"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Nested Test Project for List" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Create multiple worktrees for nested project
    run w testlist listfeature1
    [ "$status" -eq 0 ]
    run w testlist listfeature2
    [ "$status" -eq 0 ]
    
    # Test listing shows the nested project worktrees
    run w --list
    [ "$status" -eq 0 ]
    [[ "$output" == *"[testlist]"* ]]
    [[ "$output" == *"(nested structure)"* ]]
    [[ "$output" == *"listfeature1"* ]]
    [[ "$output" == *"listfeature2"* ]]
}

@test "w --list shows worktrees in multiple nested projects" {
    # Create first nested project: proj1/proj1/.git
    mkdir -p "$TEST_PROJECTS/proj1/proj1"
    cd "$TEST_PROJECTS/proj1/proj1"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Project 1" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Create second nested project: proj2/proj2/.git
    mkdir -p "$TEST_PROJECTS/proj2/proj2"
    cd "$TEST_PROJECTS/proj2/proj2"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Project 2" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Create worktrees for both projects
    run w proj1 feature1
    [ "$status" -eq 0 ]
    run w proj2 feature2
    [ "$status" -eq 0 ]
    
    # Test listing shows both nested projects
    run w --list
    [ "$status" -eq 0 ]
    [[ "$output" == *"[proj1]"* ]]
    [[ "$output" == *"[proj2]"* ]]
    [[ "$output" == *"feature1"* ]]
    [[ "$output" == *"feature2"* ]]
}

@test "w --list shows worktrees in both regular and nested structures" {
    # Create regular project: regular/.git
    mkdir -p "$TEST_PROJECTS/regular"
    cd "$TEST_PROJECTS/regular"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Regular Project" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Create nested project: nested/nested/.git
    mkdir -p "$TEST_PROJECTS/nested/nested"
    cd "$TEST_PROJECTS/nested/nested"
    git init
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# Nested Project" > README.md
    git add .
    git commit -m "Initial commit"
    cd "$TEST_HOME"
    
    # Create worktrees for both projects
    run w regular regfeature
    [ "$status" -eq 0 ]
    run w nested nestfeature
    [ "$status" -eq 0 ]
    
    # Test listing shows both types
    run w --list
    [ "$status" -eq 0 ]
    [[ "$output" == *"[regular]"* ]]
    [[ "$output" == *"[nested]"* ]]
    [[ "$output" == *"(nested structure)"* ]]
    [[ "$output" == *"regfeature"* ]]
    [[ "$output" == *"nestfeature"* ]]
}
