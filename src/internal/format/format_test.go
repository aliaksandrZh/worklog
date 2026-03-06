package format

import "testing"

func TestPad(t *testing.T) {
	tests := []struct {
		input string
		width int
		want  string
	}{
		{"abc", 5, "abc  "},
		{"abcdef", 5, "abcd…"},
		{"abc", 3, "abc"},
		{"", 3, "   "},
		{"Type▲", 6, "Type▲ "},
		{"Date▼", 6, "Date▼ "},
	}
	for _, tt := range tests {
		got := Pad(tt.input, tt.width)
		if got != tt.want {
			t.Errorf("Pad(%q, %d) = %q, want %q", tt.input, tt.width, got, tt.want)
		}
	}
}
