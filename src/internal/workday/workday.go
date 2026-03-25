package workday

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"time"
)

// Data represents a running workday persisted to .workday.json.
type Data struct {
	StartedAt  int64 `json:"startedAt"`  // Unix milliseconds
	LastTaskAt int64 `json:"lastTaskAt"` // Unix milliseconds, 0 if no tasks added yet
}

// Status is the current workday state with calculated elapsed time.
type Status struct {
	Data
	Elapsed float64 // total hours since start
}

// Timer manages workday persistence.
type Timer struct {
	dir string
}

// New creates a Timer that stores .workday.json in the given directory.
func New(dir string) *Timer {
	return &Timer{dir: dir}
}

func (t *Timer) path() string {
	return filepath.Join(t.dir, ".workday.json")
}

func nowMs() int64 {
	return time.Now().UnixMilli()
}

// Start begins a new workday. Errors if one is already active.
func (t *Timer) Start() error {
	if _, err := os.Stat(t.path()); err == nil {
		return fmt.Errorf("workday already started")
	}
	d := Data{StartedAt: nowMs()}
	return t.save(d)
}

// Stop ends the current workday. Errors if none is active.
func (t *Timer) Stop() error {
	if _, err := os.Stat(t.path()); err != nil {
		return fmt.Errorf("no workday running")
	}
	return os.Remove(t.path())
}

// GetStatus returns the current workday status, or nil if not active.
func (t *Timer) GetStatus() *Status {
	d, err := t.load()
	if err != nil {
		return nil
	}
	elapsed := float64(nowMs()-d.StartedAt) / 3600000
	return &Status{Data: *d, Elapsed: elapsed}
}

// ElapsedSinceLastTask returns hours since the last task was added (or since
// workday start if no tasks yet). Returns 0 if workday is not active.
// The minimum returned value is 0.1h.
func (t *Timer) ElapsedSinceLastTask() float64 {
	d, err := t.load()
	if err != nil {
		return 0
	}
	ref := d.StartedAt
	if d.LastTaskAt > 0 {
		ref = d.LastTaskAt
	}
	hours := float64(nowMs()-ref) / 3600000
	return math.Max(hours, 0.1)
}

// RecordTaskAdd updates LastTaskAt to now.
func (t *Timer) RecordTaskAdd() error {
	d, err := t.load()
	if err != nil {
		return err
	}
	d.LastTaskAt = nowMs()
	return t.save(*d)
}

func (t *Timer) save(d Data) error {
	b, err := json.MarshalIndent(d, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(t.path(), b, 0o644)
}

func (t *Timer) load() (*Data, error) {
	b, err := os.ReadFile(t.path())
	if err != nil {
		return nil, err
	}
	var d Data
	if err := json.Unmarshal(b, &d); err != nil {
		return nil, err
	}
	return &d, nil
}
