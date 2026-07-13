```markdown
# finally.help Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill covers the core development patterns used in the `finally.help` JavaScript codebase. It documents file naming, import/export conventions, commit message standards, and testing patterns. While no specific frameworks or automated workflows were detected, this guide helps maintain consistency and efficiency in contributing to the project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.js`, `apiClient.js`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```javascript
    import { fetchData } from './apiClient';
    ```

### Export Style
- Use **named exports**.
  - Example:
    ```javascript
    // In apiClient.js
    export function fetchData() { ... }
    ```
    ```javascript
    // In another file
    import { fetchData } from './apiClient';
    ```

### Commit Messages
- Follow **conventional commit** style.
- Use the `feat` prefix for new features.
  - Example: `feat: add user authentication to login page`

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new file using camelCase naming.
2. Write your code using named exports.
3. Import dependencies using relative paths.
4. Write or update corresponding test files (`*.test.js`).
5. Commit your changes using the `feat:` prefix and a concise description.
    - Example: `feat: implement password reset functionality`
6. Submit a pull request for review.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Identify or create test files matching the `*.test.*` pattern.
2. Run tests using the project's preferred testing tool (framework not specified).
3. Ensure all tests pass before merging or deploying changes.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `userProfile.test.js`).
- The specific testing framework is not specified; use the project's documented or common JavaScript testing tools (e.g., Jest, Mocha).
- Place test files alongside the code they test or in a dedicated `tests` directory.

  Example test file:
  ```javascript
  // userProfile.test.js
  import { getUserProfile } from './userProfile';

  test('returns correct user data', () => {
    const result = getUserProfile(1);
    expect(result.name).toBe('Alice');
  });
  ```

## Commands
| Command               | Purpose                                   |
|-----------------------|-------------------------------------------|
| /feature-development  | Guide for adding a new feature            |
| /run-tests            | Steps to run and verify tests             |
```
