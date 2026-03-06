package prefs

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Prefs holds user preferences persisted to .prefs.json.
type Prefs struct {
	SortBy  string `json:"sortBy,omitempty"`
	SortDir string `json:"sortDir,omitempty"`
}

// Store manages preferences persistence.
type Store struct {
	Dir string
}

// New creates a preferences store in the given directory.
func New(dir string) *Store {
	return &Store{Dir: dir}
}

func (s *Store) path() string {
	return filepath.Join(s.Dir, ".prefs.json")
}

// Load reads preferences from disk. Returns empty prefs on error.
func (s *Store) Load() Prefs {
	b, err := os.ReadFile(s.path())
	if err != nil {
		return Prefs{}
	}
	var p Prefs
	if err := json.Unmarshal(b, &p); err != nil {
		return Prefs{}
	}
	return p
}

// Save merges the given prefs with existing ones and writes to disk.
func (s *Store) Save(p Prefs) error {
	current := s.Load()
	if p.SortBy != "" || p.SortBy == "" {
		current.SortBy = p.SortBy
	}
	if p.SortDir != "" {
		current.SortDir = p.SortDir
	}
	b, err := json.MarshalIndent(current, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path(), b, 0o644)
}
