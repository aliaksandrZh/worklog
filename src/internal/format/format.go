package format

import "strings"

// Fixed column widths.
const (
	DateWidth      = 12
	TypeWidth      = 6
	NumberWidth    = 8
	TimeSpentWidth = 8
	MinName        = 10
	MinComments    = 5
)

// Gap between columns.
const Gap = "  "

// Pad pads or truncates a string to the given display width (rune-aware).
func Pad(s string, width int) string {
	runes := []rune(s)
	if len(runes) > width {
		if width <= 1 {
			return string(runes[:width])
		}
		return string(runes[:width-1]) + "…"
	}
	return s + strings.Repeat(" ", width-len(runes))
}
