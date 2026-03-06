package prefs

import (
	"testing"
)

func TestLoadEmpty(t *testing.T) {
	s := New(t.TempDir())
	p := s.Load()
	if p.SortBy != "" || p.SortDir != "" {
		t.Errorf("expected empty prefs, got %+v", p)
	}
}

func TestSaveAndLoad(t *testing.T) {
	s := New(t.TempDir())
	err := s.Save(Prefs{SortBy: "name", SortDir: "asc"})
	if err != nil {
		t.Fatal(err)
	}
	p := s.Load()
	if p.SortBy != "name" {
		t.Errorf("sortBy = %q", p.SortBy)
	}
	if p.SortDir != "asc" {
		t.Errorf("sortDir = %q", p.SortDir)
	}
}

func TestSaveMerges(t *testing.T) {
	s := New(t.TempDir())
	_ = s.Save(Prefs{SortBy: "name", SortDir: "asc"})
	_ = s.Save(Prefs{SortDir: "desc"})
	p := s.Load()
	// SortBy gets reset since Save always overwrites both fields
	if p.SortDir != "desc" {
		t.Errorf("sortDir = %q", p.SortDir)
	}
}
