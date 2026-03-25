package note

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Data represents a sticky note persisted to .note.json.
type Data struct {
	Text string `json:"text"`
}

// Store manages note persistence.
type Store struct {
	dir string
}

// New creates a Store that reads/writes .note.json in the given directory.
func New(dir string) *Store {
	return &Store{dir: dir}
}

func (s *Store) path() string {
	return filepath.Join(s.dir, ".note.json")
}

// Load returns the current note text, or empty string if none.
func (s *Store) Load() string {
	b, err := os.ReadFile(s.path())
	if err != nil {
		return ""
	}
	var d Data
	if err := json.Unmarshal(b, &d); err != nil {
		return ""
	}
	return d.Text
}

// Save persists the note text. If text is empty, removes the file.
func (s *Store) Save(text string) error {
	if text == "" {
		os.Remove(s.path())
		return nil
	}
	b, err := json.MarshalIndent(Data{Text: text}, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path(), b, 0o644)
}
