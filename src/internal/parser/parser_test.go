package parser

import (
	"testing"
)

func TestParseLine_Full(t *testing.T) {
	typ, number, name, timeSpent, comments := ParseLine("Bug 123: Fix login 1h")
	if typ != "Bug" {
		t.Errorf("type = %q, want Bug", typ)
	}
	if number != "123" {
		t.Errorf("number = %q, want 123", number)
	}
	if name != "Fix login" {
		t.Errorf("name = %q, want Fix login", name)
	}
	if timeSpent != "1h" {
		t.Errorf("timeSpent = %q, want 1h", timeSpent)
	}
	if comments != "" {
		t.Errorf("comments = %q, want empty", comments)
	}
}

func TestParseLine_TaskType(t *testing.T) {
	typ, _, _, _, _ := ParseLine("Task 456: Add feature 2h")
	if typ != "Task" {
		t.Errorf("type = %q, want Task", typ)
	}
}

func TestParseLine_CaseInsensitive(t *testing.T) {
	typ, _, _, _, _ := ParseLine("bug 123: Fix 1h")
	if typ != "Bug" {
		t.Errorf("type = %q, want Bug", typ)
	}
	typ, _, _, _, _ = ParseLine("TASK 456: Fix 1h")
	if typ != "Task" {
		t.Errorf("type = %q, want Task", typ)
	}
}

func TestParseLine_NoTime(t *testing.T) {
	_, _, name, timeSpent, _ := ParseLine("Bug 123: Fix login")
	if name != "Fix login" {
		t.Errorf("name = %q", name)
	}
	if timeSpent != "" {
		t.Errorf("timeSpent should be empty, got %q", timeSpent)
	}
}

func TestParseLine_CompoundTime(t *testing.T) {
	_, _, _, timeSpent, _ := ParseLine("Bug 123: Fix login 1h 30m")
	if timeSpent != "1h 30m" {
		t.Errorf("timeSpent = %q, want 1h 30m", timeSpent)
	}
}

func TestParseLine_BareNumber(t *testing.T) {
	_, _, _, timeSpent, _ := ParseLine("Bug 123: Fix login 1.5")
	if timeSpent != "1.5h" {
		t.Errorf("timeSpent = %q, want 1.5h", timeSpent)
	}
}

func TestParseLine_MinutesOnly(t *testing.T) {
	_, _, _, timeSpent, _ := ParseLine("Bug 123: Fix login 30m")
	if timeSpent != "30m" {
		t.Errorf("timeSpent = %q, want 30m", timeSpent)
	}
}

func TestParseLine_HashNumber(t *testing.T) {
	_, number, _, _, _ := ParseLine("Bug #123: Fix login 1h")
	if number != "123" {
		t.Errorf("number = %q, want 123", number)
	}
}

func TestParseLine_PRPrefix(t *testing.T) {
	typ, number, name, _, comments := ParseLine("Pull Request 99999: Bug 123: Fix login 1h")
	if comments != "Pull Request 99999" {
		t.Errorf("comments = %q, want Pull Request 99999", comments)
	}
	if typ != "Bug" {
		t.Errorf("type = %q, want Bug", typ)
	}
	if number != "123" {
		t.Errorf("number = %q", number)
	}
	if name != "Fix login" {
		t.Errorf("name = %q", name)
	}
}

func TestParsePastedText_WithDate(t *testing.T) {
	text := "3/5/2026\nBug 123: Fix login 1h\nTask 456: Add feature 2h"
	tasks := ParsePastedText(text)
	if len(tasks) != 2 {
		t.Fatalf("expected 2 tasks, got %d", len(tasks))
	}
	if tasks[0].Date != "3/5/2026" {
		t.Errorf("date = %q", tasks[0].Date)
	}
	if tasks[1].Date != "3/5/2026" {
		t.Errorf("date = %q", tasks[1].Date)
	}
}

func TestParsePastedText_NoDate(t *testing.T) {
	text := "Bug 123: Fix login 1h"
	tasks := ParsePastedText(text)
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
	// Date should default to today
	if tasks[0].Date == "" {
		t.Error("date should default to today")
	}
	// "date" should be in missing
	found := false
	for _, m := range tasks[0].Missing {
		if m == "date" {
			found = true
		}
	}
	if !found {
		t.Error("missing should include 'date'")
	}
}

func TestParsePastedText_MissingFields(t *testing.T) {
	text := "123: Fix login"
	tasks := ParsePastedText(text)
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
	missing := tasks[0].Missing
	hasType := false
	hasTimeSpent := false
	for _, m := range missing {
		if m == "type" {
			hasType = true
		}
		if m == "timeSpent" {
			hasTimeSpent = true
		}
	}
	if !hasType {
		t.Error("missing should include 'type'")
	}
	if !hasTimeSpent {
		t.Error("missing should include 'timeSpent'")
	}
}

func TestParsePastedText_MultipleDates(t *testing.T) {
	text := "3/4/2026\nBug 1: A 1h\n3/5/2026\nBug 2: B 2h"
	tasks := ParsePastedText(text)
	if len(tasks) != 2 {
		t.Fatalf("expected 2 tasks, got %d", len(tasks))
	}
	if tasks[0].Date != "3/4/2026" {
		t.Errorf("first task date = %q", tasks[0].Date)
	}
	if tasks[1].Date != "3/5/2026" {
		t.Errorf("second task date = %q", tasks[1].Date)
	}
}

func TestParsePastedText_Empty(t *testing.T) {
	tasks := ParsePastedText("")
	if len(tasks) != 0 {
		t.Errorf("expected 0 tasks, got %d", len(tasks))
	}
}

func TestParsePastedText_ISODate(t *testing.T) {
	text := "2026-03-05\nBug 123: Fix 1h"
	tasks := ParsePastedText(text)
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
	if tasks[0].Date != "2026-03-05" {
		t.Errorf("date = %q", tasks[0].Date)
	}
}
