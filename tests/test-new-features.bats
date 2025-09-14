#!/usr/bin/env bats

# Tests for new features: w <repo> - and w <repo> - <command>

# Shared setup and teardown
source "$BATS_TEST_DIRNAME/shared-setup.bash"

@test "w <repo> - changes directory to base repo dir" {
    run w testproject - pwd
    [ "$status" -eq 0 ]
    output_trimmed=$(echo "$output" | tr -d '\n')
    [[ "$output_trimmed" == "$TEST_PROJECTS/testproject" ]]
}

@test "w <repo> - <command> executes command in base repo dir" {
    run w testproject - ls -a
    [ "$status" -eq 0 ]
    [[ "$output" == *"README.md"* ]]
    [[ "$output" == *".git"* ]]
}

@test "w <repo> - does not create worktree named -" {
    run w testproject -
    [ "$status" -eq 0 ]
    [[ ! -d "$TEST_PROJECTS/worktrees/testproject/-" ]]
}
