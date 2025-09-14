# Structure Extension: Nested Project Support

## Overview

The Worktree Wrangler tool has been extended to support nested project structures in addition to the existing flat structure. This allows users who organize their repositories with a project-named subdirectory (e.g., `code/massage/massage/.git`) to use the tool seamlessly.

## Supported Structures

### Flat Structure (existing)
```
projects/
└── {project}/
    └── .git/
```
Example: `~/code/massage/.git`

### Nested Structure (new)
```
projects/
└── {project}/
    └── {project}/
        └── .git/
```
Example: `~/code/massage/massage/.git`

**Important:** In nested structures, the inner directory must match the project name exactly.

## Implementation Details

### Core Changes

1. **Project Root Detection Function**
   - Added `resolve_project_root()` function in `worktree-wrangler.zsh`
   - Checks for `.git` in both flat (`$projects_dir/$project/.git`) and nested (`$projects_dir/$project/$project/.git`) locations
   - Returns the correct git repository path or empty string if not found

2. **Updated Project Listing**
   - Modified `list_valid_projects()` to scan for both structure types
   - Ensures all valid projects are discovered regardless of structure

3. **Consistent Usage**
   - All worktree operations, file operations, and tab-completion use the new detection function
   - Maintains backward compatibility with existing flat structures

### Error Handling

- Clear error messages when an invalid or unsupported structure is encountered
- Distinguishes between "project not found" and "invalid structure" scenarios
- Prevents operations on malformed directory layouts

## Code Changes

### worktree-wrangler.zsh

```zsh
# Helper: resolve project root (flat or nested)
resolve_project_root() {
    local project_name="$1"
    local flat_path="$projects_dir/$project_name"
    local nested_path="$projects_dir/$project_name/$project_name"
    if [[ -d "$flat_path/.git" ]]; then
        echo "$flat_path"
    elif [[ -d "$nested_path/.git" ]]; then
        echo "$nested_path"
    else
        echo ""
    fi
}

# Updated list_valid_projects
list_valid_projects() {
    for dir in "$projects_dir"/*(/N); do
        if [[ -d "$dir/.git" ]]; then
            echo "$(basename "$dir")"
        elif [[ -d "$dir/$(basename "$dir")/.git" ]]; then
            echo "$(basename "$dir")"
        fi
    done
}
```

### Test Coverage

- Added comprehensive tests in `subdir-tests.bats`
- Verifies nested structure detection and worktree creation
- Ensures both flat and nested projects work correctly

## Migration

### For Existing Users

- No changes required - existing flat structures continue to work
- Nested structures are now supported automatically

### For New Projects

- Choose either flat or nested structure based on preference
- The tool will detect and handle both transparently

## Benefits

1. **Flexibility**: Supports different project organization preferences
2. **Backward Compatibility**: Existing setups unaffected
3. **Robust Detection**: Automatically finds the correct repository root
4. **Clear Errors**: Helpful messages for unsupported structures

## Testing

- All existing tests pass
- New tests verify nested structure functionality
- Manual testing confirmed with real projects

## Future Considerations

- Could potentially support arbitrary nesting levels, but currently limited to the two canonical structures for simplicity and reliability
- Error messages could be enhanced to suggest correct structure fixes
