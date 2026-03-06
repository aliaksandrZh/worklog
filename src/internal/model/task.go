package model

// Headers is the CSV column order.
var Headers = []string{"date", "type", "number", "name", "timeSpent", "comments"}

// Task represents a single work entry.
type Task struct {
	Date      string
	Type      string
	Number    string
	Name      string
	TimeSpent string
	Comments  string
}

// IndexedTask is a Task with its original index in the CSV file.
type IndexedTask struct {
	Task
	Index int
}

// ParsedTask is a Task with a list of missing fields (from parsing).
type ParsedTask struct {
	Task
	Missing []string
}
