#!/usr/bin/env bats

# Worktree Wrangler Subdir Tests
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
