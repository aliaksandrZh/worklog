package parser

import (
	"regexp"
	"strings"

	"github.com/aliaksandrZh/worklog/src/internal/model"
	"github.com/aliaksandrZh/worklog/src/internal/timeutil"
)

// PatternDef pairs a regex with an extraction function.
type PatternDef struct {
	Re      *regexp.Regexp
	Extract func([]string) string
}

// DatePatterns matches standalone date lines.
var DatePatterns = []*regexp.Regexp{
	regexp.MustCompile(`^(\d{1,2}/\d{1,2}/\d{4})$`),
	regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})$`),
}

// PrefixPattern matches "Pull Request XXXXX:" at start of line.
var PrefixPattern = regexp.MustCompile(`(?i)^Pull\s+Request\s+\d+\s*:\s*`)

// TypePatterns extracts task type (Bug, Task).
var TypePatterns = []PatternDef{
	{Re: regexp.MustCompile(`(?i)^(Bug|Task)\b`), Extract: func(m []string) string { return m[1] }},
}

// NumberPatterns extracts task number.
var NumberPatterns = []PatternDef{
	{Re: regexp.MustCompile(`^#?(\d+)\s*:?\s*`), Extract: func(m []string) string { return m[1] }},
}

// TimePatterns extracts time spent (at end of line).
var TimePatterns = []PatternDef{
	{Re: regexp.MustCompile(`\s+(\d+(?:\.\d+)?h\s*\d+(?:\.\d+)?m)$`), Extract: func(m []string) string { return m[1] }},
	{Re: regexp.MustCompile(`\s+(\d+(?:\.\d+)?[hm])$`), Extract: func(m []string) string { return m[1] }},
	{Re: regexp.MustCompile(`\s+(\d+(?:\.\d+)?)$`), Extract: func(m []string) string { return m[1] + "h" }},
}

// TryPatterns tries each pattern against text, returning the match and extracted value.
func TryPatterns(patterns []PatternDef, text string) (match []string, extracted string, matchLen int, ok bool) {
	for _, p := range patterns {
		m := p.Re.FindStringSubmatch(text)
		if m != nil {
			return m, p.Extract(m), len(m[0]), true
		}
	}
	return nil, "", 0, false
}

func normalizeType(t string) string {
	if len(t) == 0 {
		return t
	}
	return strings.ToUpper(t[:1]) + strings.ToLower(t[1:])
}

// ParseLine parses a single task line into fields.
func ParseLine(line string) (typ, number, name, timeSpent, comments string) {
	remaining := line

	// Strip "Pull Request XXXXX:" prefix, save to comments
	if loc := PrefixPattern.FindStringIndex(remaining); loc != nil {
		prefix := strings.TrimSpace(remaining[loc[0]:loc[1]])
		comments = strings.TrimRight(prefix, ": ")
		remaining = strings.TrimSpace(remaining[loc[1]:])
	}

	// Type
	if m, extracted, _, ok := TryPatterns(TypePatterns, remaining); ok {
		typ = normalizeType(extracted)
		remaining = strings.TrimSpace(remaining[len(m[0]):])
	} else {
		// Try skipping unknown word before a number (Go doesn't support lookahead)
		re := regexp.MustCompile(`^\S+\s+(\d)`)
		if loc := re.FindStringSubmatchIndex(remaining); loc != nil {
			// Advance to where the digit starts (submatch index 2)
			remaining = strings.TrimSpace(remaining[loc[2]:])
		}
	}

	// Number
	if m, extracted, _, ok := TryPatterns(NumberPatterns, remaining); ok {
		number = extracted
		remaining = strings.TrimSpace(remaining[len(m[0]):])
	}

	// Time (from end)
	if _, extracted, _, ok := TryPatterns(TimePatterns, remaining); ok {
		timeSpent = extracted
		// Find and remove the time match from the end
		for _, p := range TimePatterns {
			if loc := p.Re.FindStringIndex(remaining); loc != nil {
				remaining = strings.TrimSpace(remaining[:loc[0]])
				break
			}
		}
	}

	name = remaining
	return
}

// ParsePastedText parses multi-line pasted text into tasks.
func ParsePastedText(text string) []model.ParsedTask {
	lines := strings.Split(text, "\n")
	var tasks []model.ParsedTask
	currentDate := ""

	for _, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}

		// Check for date line
		isDate := false
		for _, re := range DatePatterns {
			if m := re.FindStringSubmatch(line); m != nil {
				currentDate = m[1]
				isDate = true
				break
			}
		}
		if isDate {
			continue
		}

		typ, number, name, timeSpent, comments := ParseLine(line)

		var missing []string
		if currentDate == "" {
			missing = append(missing, "date")
		}
		if typ == "" {
			missing = append(missing, "type")
		}
		if number == "" {
			missing = append(missing, "number")
		}
		if name == "" {
			missing = append(missing, "name")
		}
		if timeSpent == "" {
			missing = append(missing, "timeSpent")
		}

		date := currentDate
		if date == "" {
			date = timeutil.TodayStr()
		}

		tasks = append(tasks, model.ParsedTask{
			Task: model.Task{
				Date:      date,
				Type:      typ,
				Number:    number,
				Name:      name,
				TimeSpent: timeSpent,
				Comments:  comments,
			},
			Missing: missing,
		})
	}

	return tasks
}
