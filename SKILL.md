# Pull Request & Feature Development Skill

## Pull Request Criteria

### The Single Responsibility Principle
**The most important rule of all: there should only be one way to do something.**

When creating a pull request, evaluate:

- **Are we re-using things instead of re-creating them?**
  - Ensure code reuses existing patterns and components

- **Is it easy to understand what's going on?**
  - Code clarity and readability are essential

- **Is the PR scoped correctly?**
  - Is it focused on a single objective, or is there a bunch of different stuff happening that should have been split up?

- **Are there any anti-patterns?**
  - Avoid async imports halfway down the code
  - Ensure repositories and conventions already established in the codebase are being used
  - Don't introduce new patterns when existing ones work

---

## Feature Development Process

### 1. Define Your Objective
Start by clearly defining what you want to accomplish.

**Example:** _Add audio capture to any input component in the codebase_

### 2. Research the Codebase
Explore `/cliresearch-codebase` to understand existing implementations.

#### Key Research Questions:
- Are there any audio capture components already in the codebase?
- Find all files related to audio capture and create a tree view
- For each file, provide a short summary explaining what it does
- **Create documentation files:**
  - `audio-capture-explanation.md` - Explain how the current audio capture system works from user input through the entire process. Show a diagram that includes the files involved.
  - `audio-capture-discussion-key-points.md` - Capture new questions that emerge during research

#### The Rabbit Hole Loop
Be aware of getting lost in exploration. Use findings to set the stage for clean implementation.

### 3. Creating Plans
Use `/create-prp` to establish a planning document with:
- Specific instructions that set the LLM up for success
- Correctly scoped plan (not too big)

### 4. Implementation
Use `/implement-plan` to execute the plan:
- Keep implementation scope correct (not too big)
- Manage context well via sub-agents
- Address the plan step-by-step

### 5. Review
Use `/roast` or `/simplify` to review the implementation.

**Codex:** Keep changes to 5.2 high-level items maximum

#### Avoiding the Death Loop
The death loop occurs when:
- Plan is too big for the LLM to handle
- Context runs out, forcing shortcuts and incomplete work
- The implementation keeps trying to finish despite running out of tokens
- This leads to a day spent trying to get something to work

**Solution:** Keep plans appropriately scoped so they can be completed within context limits.

---

## Summary

Follow this process for clean, focused feature development:
1. Define a single, clear objective
2. Research existing patterns thoroughly
3. Create a properly scoped plan
4. Execute with the right context management
5. Review and simplify
6. Avoid scope creep and the death loop by keeping plans manageable
