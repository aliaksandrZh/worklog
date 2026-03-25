package note

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadEmpty(t *testing.T) {
	dir := t.TempDir()
	s := New(dir)
	if got := s.Load(); got != "" {
		t.Errorf("expected empty, got %q", got)
	}
}

func TestSaveAndLoad(t *testing.T) {
	dir := t.TempDir()
	s := New(dir)

	if err := s.Save("need to track +5h"); err != nil {
		t.Fatalf("save: %v", err)
	}

	if got := s.Load(); got != "need to track +5h" {
		t.Errorf("expected 'need to track +5h', got %q", got)
	}
}

func TestSaveEmptyRemovesFile(t *testing.T) {
	dir := t.TempDir()
	s := New(dir)

	_ = s.Save("some note")
	_ = s.Save("")

	if _, err := os.Stat(filepath.Join(dir, ".note.json")); !os.IsNotExist(err) {
		t.Error("expected file to be removed after saving empty text")
	}

	if got := s.Load(); got != "" {
		t.Errorf("expected empty after clear, got %q", got)
	}
}

func TestOverwrite(t *testing.T) {
	dir := t.TempDir()
	s := New(dir)

	_ = s.Save("first")
	_ = s.Save("second")

	if got := s.Load(); got != "second" {
		t.Errorf("expected 'second', got %q", got)
	}
}
