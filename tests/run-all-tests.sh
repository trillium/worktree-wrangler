#!/bin/bash

# Run All Worktree Wrangler T Test Files
# This script runs all the main BATS test files for Worktree Wrangler T

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Worktree Wrangler T - Running All Test Files${NC}"
echo "=================================================="

# Track results
total_tests=0
total_passed=0
total_failed=0

# Function to run a test file and track results
run_test_file() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .bats)

    echo -e "\n${BLUE}🧪 Running $test_file${NC}"

    if bats "$test_file" 2>/dev/null; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Run all main test files
test_files=(
    "tests.bats"
    "subdir-tests.bats"
    "test-new-features.bats"
)

for test_file in "${test_files[@]}"; do
    if [ -f "$test_file" ]; then
        if run_test_file "$test_file"; then
            ((total_passed++))
        else
            ((total_failed++))
        fi
        ((total_tests++))
    else
        echo -e "${RED}⚠️  Test file not found: $test_file${NC}"
    fi
done

echo ""
echo "=================================================="
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo "  Total test files: $total_tests"
echo -e "  ${GREEN}Passed: $total_passed${NC}"
if [ $total_failed -gt 0 ]; then
    echo -e "  ${RED}Failed: $total_failed${NC}"
    exit 1
else
    echo -e "  ${GREEN}All tests passed! 🎉${NC}"
fi
