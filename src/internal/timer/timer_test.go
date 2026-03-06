package timer

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFormatElapsed(t *testing.T) {
	tests := []struct {
		ms   int64
		want string
	}{
		{0, "0m"},
		{30000, "0m"},          // 30s rounds to 0
		{60000, "1m"},          // 1 min
		{2700000, "45m"},       // 45 min
		{3600000, "1h"},        // 60 min
		{5400000, "1h 30m"},    // 90 min
		{7200000, "2h"},        // 120 min
	}
	for _, tt := range tests {
		got := FormatElapsed(tt.ms)
		if got != tt.want {
			t.Errorf("FormatElapsed(%d) = %q, want %q", tt.ms, got, tt.want)
		}
	}
}

func TestStartAndStop(t *testing.T) {
	dir := t.TempDir()
	tmr := New(dir)

	data, err := tmr.Start("Bug", "123", "Fix login")
	if err != nil {
		t.Fatal(err)
	}
	if data.Type != "Bug" || data.Number != "123" || data.Name != "Fix login" {
		t.Errorf("unexpected data: %+v", data)
	}
	if data.StartedAt == 0 {
		t.Error("startedAt should be set")
	}

	// File should exist
	if _, err := os.Stat(filepath.Join(dir, ".timer.json")); os.IsNotExist(err) {
		t.Error("timer file should exist")
	}

	// Stop
	status, err := tmr.Stop()
	if err != nil {
		t.Fatal(err)
	}
	if status.Type != "Bug" {
		t.Errorf("type = %q", status.Type)
	}
	if status.Elapsed < 0 {
		t.Error("elapsed should be >= 0")
	}

	// File should be gone
	if _, err := os.Stat(filepath.Join(dir, ".timer.json")); !os.IsNotExist(err) {
		t.Error("timer file should be deleted after stop")
	}
}

func TestStartDoubleError(t *testing.T) {
	dir := t.TempDir()
	tmr := New(dir)

	_, err := tmr.Start("Bug", "123", "Fix")
	if err != nil {
		t.Fatal(err)
	}

	_, err = tmr.Start("Task", "456", "Add")
	if err == nil {
		t.Error("expected error for double start")
	}

	// Cleanup
	tmr.Stop()
}

func TestStopWithoutStart(t *testing.T) {
	dir := t.TempDir()
	tmr := New(dir)

	_, err := tmr.Stop()
	if err == nil {
		t.Error("expected error for stop without start")
	}
}

func TestGetStatus(t *testing.T) {
	dir := t.TempDir()
	tmr := New(dir)

	// No timer
	status := tmr.GetStatus()
	if status != nil {
		t.Error("expected nil status when no timer")
	}

	// Start timer
	tmr.Start("Bug", "123", "Fix login")
	status = tmr.GetStatus()
	if status == nil {
		t.Fatal("expected status")
	}
	if status.Type != "Bug" {
		t.Errorf("type = %q", status.Type)
	}
	if status.Number != "123" {
		t.Errorf("number = %q", status.Number)
	}

	// Cleanup
	tmr.Stop()
}
