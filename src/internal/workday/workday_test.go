package workday

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStartAndStatus(t *testing.T) {
	dir := t.TempDir()
	tm := New(dir)

	if s := tm.GetStatus(); s != nil {
		t.Error("expected nil status before start")
	}

	if err := tm.Start(); err != nil {
		t.Fatalf("start: %v", err)
	}

	s := tm.GetStatus()
	if s == nil {
		t.Fatal("expected non-nil status after start")
	}
	if s.Elapsed < 0 {
		t.Error("expected non-negative elapsed")
	}
}

func TestStartTwiceErrors(t *testing.T) {
	dir := t.TempDir()
	tm := New(dir)

	_ = tm.Start()
	if err := tm.Start(); err == nil {
		t.Error("expected error on double start")
	}
}

func TestStopRemovesFile(t *testing.T) {
	dir := t.TempDir()
	tm := New(dir)

	_ = tm.Start()
	if err := tm.Stop(); err != nil {
		t.Fatalf("stop: %v", err)
	}

	if _, err := os.Stat(filepath.Join(dir, ".workday.json")); !os.IsNotExist(err) {
		t.Error("expected file removed after stop")
	}

	if s := tm.GetStatus(); s != nil {
		t.Error("expected nil status after stop")
	}
}

func TestStopWithoutStartErrors(t *testing.T) {
	dir := t.TempDir()
	tm := New(dir)

	if err := tm.Stop(); err == nil {
		t.Error("expected error on stop without start")
	}
}

func TestElapsedSinceLastTask(t *testing.T) {
	dir := t.TempDir()
	tm := New(dir)

	if got := tm.ElapsedSinceLastTask(); got != 0 {
		t.Errorf("expected 0 when not active, got %f", got)
	}

	_ = tm.Start()
	got := tm.ElapsedSinceLastTask()
	if got < 0.1 {
		t.Errorf("expected at least 0.1h, got %f", got)
	}
}

func TestRecordTaskAdv(t *testing.T) {
	dir := t.TempDir()
	tm := New(dir)

	_ = tm.Start()
	if err := tm.RecordTaskAdd(); err != nil {
		t.Fatalf("record: %v", err)
	}

	s := tm.GetStatus()
	if s == nil {
		t.Fatal("expected status after record")
	}
	if s.LastTaskAt == 0 {
		t.Error("expected LastTaskAt to be set")
	}
}
