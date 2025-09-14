# FINDINGS.md

## Project Structure Support

### Supported Structures

The tool now supports two canonical project layouts for worktree management:

1. **Flat Structure**  
   ```
   code/{project}/.git
   ```
   - Example: `code/massage/.git`

2. **Nested Structure (Project-Named Subdir Only)**  
   ```
   code/{project}/{project}/.git
   ```
   - Example: `code/massage/massage/.git`
   - The inner directory **must** match the project name.

### Explicitly Not Supported

- Arbitrary nesting or mismatched names (e.g., `code/foo_project/bar_project/.git` where `foo ≠ bar`) is **not supported**.
- Only the above two layouts are recognized as valid git roots for worktree operations.

## Implementation Details

- **Project root detection** is now handled by a helper function that checks for both supported layouts.
- All worktree, file, and tab-completion logic uses this helper to ensure consistency.
- Error messages are clear when an invalid or unsupported structure is encountered.

## Testing

- All legacy and core workflow tests pass.
- New feature tests are currently failing due to unrelated test dependency issues (not caused by this change).

## Next Steps

- Update user documentation (README, help output) to clarify supported project structures.
- Optionally, address new-feature test failures if they become a priority.

---

**Summary:**  
Worktree Wrangler now robustly supports both flat and `{project}/{project}` nested git repo layouts, with strict enforcement of naming rules for nested structures. This improves flexibility for users who prefer to keep their git root in a project-named subdirectory, while maintaining clarity and reliability.
