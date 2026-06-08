# Worklog TUI

A terminal UI app for tracking daily work tasks (bugs, tasks) with time spent. Built with Go and Bubble Tea.

## Tech Stack

- **Go 1.25** with Bubble Tea (charmbracelet/bubbletea) for TUI
- **CSV file** (`tasks.csv`) for storage
- **Lipgloss** for styling, **Bubbles** for text input/viewport components

## Commands

- `go build -o tt .` — build the binary
- `go test ./...` — run all tests
- `./tt` — run the TUI

## Project Structure

```
task-tracker/
├── main.go                          # Entry point, calls cmd.Execute()
├── src/
│   ├── cmd/
│   │   └── root.go                  # CLI entry, launches TUI, registers screen factory
│   ├── internal/
│   │   ├── model/
│   │   │   └── task.go              # Task, IndexedTask, ParsedTask structs + CSV headers
│   │   ├── store/
│   │   │   ├── store.go             # CSV CRUD (TaskRepository interface: Load, Add, Update, Delete)
│   │   │   └── store_test.go
│   │   ├── parser/
│   │   │   ├── parser.go            # Lenient paste-format parser with pattern arrays
│   │   │   └── parser_test.go
│   │   ├── format/
│   │   │   ├── format.go            # Column widths, Pad helper for table formatting
│   │   │   └── format_test.go
│   │   ├── timeutil/
│   │   │   ├── timeutil.go          # ParseTime, ParseDate, GroupByDate, GetWeekBounds, etc.
│   │   │   └── timeutil_test.go
│   │   ├── timer/
│   │   │   ├── timer.go             # Timer persistence (.timer.json) for start/stop/status
│   │   │   └── timer_test.go
│   │   ├── prefs/
│   │   │   ├── prefs.go             # User preferences persistence (.prefs.json) for sort and project filter
│   │   │   └── prefs_test.go
│   │   ├── workday/
│   │   │   ├── workday.go           # Workday timer with auto-fill time on task add
│   │   │   └── workday_test.go
│   │   ├── note/
│   │   │   ├── note.go              # Daily notes persistence
│   │   │   └── note_test.go
│   │   └── update/
│   │       └── update.go            # Async git fetch to check for updates
│   └── tui/
│       ├── app.go                   # Root Bubble Tea model (App), screen routing, flash messages
│       ├── messages.go              # Shared message types for TUI communication
│       ├── styles.go                # Shared lipgloss styles (colors, borders)
│       ├── inputbar/
│       │   ├── inputbar.go          # Reusable bottom input bar with placeholder and hints
│       │   └── inputbar_test.go
│       ├── summary/
│       │   ├── summary.go           # Summary screen (daily/weekly/monthly view, add, edit, delete, filter, timer)
│       │   ├── add_test.go
│       │   └── filter_test.go
│       └── table/
│           ├── table.go             # Reusable styled task table with sorting and selection
│           └── table_test.go
├── go.mod
├── go.sum
└── tasks.csv                        # Data file (auto-created, gitignored)
```

## CSV Format

File: `tasks.csv` (auto-created on first run, gitignored)

Columns: `date,type,number,name,timeSpent,project,comments`

## Architecture

### App (`src/tui/app.go`)

Root Bubble Tea model. Manages screen routing via `ScreenModel` interface, flash messages, timer status display, and update notifications. Uses `ScreenFactory` (set by `cmd/root.go`) to create screen models, avoiding import cycles.

### Summary Screen (`src/tui/summary/summary.go`)

The main screen with multiple phases: `view`, `select`, `editing`, `confirmDelete`, `filter`, `adding`, `addFill`, `timerStart`, `projectFilter`. Supports daily/weekly/monthly views with date navigation, task add/edit/delete, filtering, sorting, project filtering, and timer start.

### Parser (`src/internal/parser/parser.go`)

Lenient, field-by-field extraction pipeline. Each field has its own pattern array:

- `ProjectPattern` — `[ProjectName]` prefix at start of line
- `DatePatterns` — standalone date lines (`M/D/YYYY`, `YYYY-MM-DD`)
- `TypePatterns` — task type at start of line (`Bug`, `Task`)
- `NumberPatterns` — task number (`123`, `#123`, `123:`)
- `TimePatterns` — time at end of line (`1h`, `30m`, `1h 30m`)
- `PrefixPattern` — strips "Pull Request XXXXX:" into comments

Pipeline: project → type → number → time → name (whatever remains). Unknown fields are reported in a `Missing` slice so the UI can prompt the user. Tasks can belong to multiple comma-separated projects.

### Store (`src/internal/store/store.go`)

CSV read/write with `TaskRepository` interface (combines `TaskReader` + `TaskWriter`). Functions: `LoadTasks`, `AddTask`, `AddTasks`, `UpdateTask`, `DeleteTask`.

### Timer (`src/internal/timer/timer.go`)

Persists running timer to `.timer.json`. Types: `Timer`, `TimerData`, `TimerStatus`. Methods: `Start`, `Stop`, `Status`, `FormatElapsed`.

### Format (`src/internal/format/format.go`)

Fixed column widths and `Pad` helper for table rendering. Shared between CLI and TUI table.

### TimeUtil (`src/internal/timeutil/timeutil.go`)

Time parsing and date utilities: `ParseTime`, `ParseDate`, `GetWeekBounds`, `FormatDateShort`, `GroupByDate`, etc.

### Prefs (`src/internal/prefs/prefs.go`)

Persists user preferences (sort column, sort direction, project filter) to `.prefs.json`.

### Workday (`src/internal/workday/workday.go`)

Workday timer with start/stop and auto-fill time on task add. Persists to `.workday.json`.

### Note (`src/internal/note/note.go`)

Daily notes persistence. Stores a single text note per day in `.note.json`.

### Update (`src/internal/update/update.go`)

Async git fetch on startup to check if local branch is behind remote. Non-blocking.

### Input Bar (`src/tui/inputbar/inputbar.go`)

Reusable bottom input bar component with placeholder text and keybinding hints.

### Table (`src/tui/table/table.go`)

Reusable styled task table with sorting indicators, row selection, and color-coded task types.

## Testing

Tests use Go's built-in `testing` package, run via `go test ./...`.

- `store_test.go` — CSV CRUD tests in a temp directory
- `parser_test.go` — pattern matching and `ParsePastedText` tests
- `timeutil_test.go` — ParseTime, ParseDate, GetWeekBounds, etc.
- `format_test.go` — Pad, column width tests
- `timer_test.go` — timer start/stop/status tests
- `prefs_test.go` — preferences persistence tests
- `workday_test.go` — workday timer tests
- `note_test.go` — note persistence tests
- `inputbar_test.go` — input bar component tests
- `table_test.go` — table rendering tests
- `add_test.go` — add task flow tests
- `filter_test.go` — filter functionality tests

## Rules

- All new code must be covered with tests. Run `go test ./...` before committing/pushing.

## Key Design Decisions

- Parser is lenient by design: extracts what it can, prompts for the rest
- `timeSpent` is always optional (not prompted during fill phase)
- Date defaults to today if no date line is provided
- Project is parsed from `[ProjectName]` prefix; tasks support multiple comma-separated projects
- Global project filter (`p`) and inline cell project picker both use compact `▸` style — no modal overlay
- Project list is always rebuilt from task data; no separate `.projects.json` store
- Each pattern group is a separate exported array for easy expansion
- `ScreenFactory` pattern avoids import cycles between `cmd` and `tui` packages
- Single summary screen handles all modes (view, add, edit, delete, filter, timer, project) via phase state machine
