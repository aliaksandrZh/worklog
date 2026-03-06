package timerstart

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"github.com/aliaksandrZh/worklog/src/internal/parser"
	"github.com/aliaksandrZh/worklog/src/internal/timer"
	appTui "github.com/aliaksandrZh/worklog/src/tui"
)

// Model is the timer start screen.
type Model struct {
	input textinput.Model
	tmr   *timer.Timer
}

// New creates a new timer start model.
func New(tmr *timer.Timer) *Model {
	ti := textinput.New()
	ti.Placeholder = "Bug 123: Fix login"
	ti.Focus()
	ti.CharLimit = 200
	return &Model{input: ti, tmr: tmr}
}

func (m *Model) Init() tea.Cmd {
	return textinput.Blink
}

func (m *Model) Update(msg tea.Msg) (appTui.ScreenModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEscape:
			return m, done()
		case tea.KeyEnter:
			return m.submit()
		}
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m *Model) submit() (appTui.ScreenModel, tea.Cmd) {
	val := strings.TrimSpace(m.input.Value())
	if val == "" {
		return m, nil
	}

	typ, number, name, _, _ := parser.ParseLine(val)
	if typ == "" && number == "" && name == "" {
		return m, tea.Batch(
			flash("Could not parse. Use: Bug 123: Fix login"),
			done(),
		)
	}

	_, err := m.tmr.Start(typ, number, name)
	if err != nil {
		return m, tea.Batch(flash(err.Error()), done())
	}

	label := strings.Join(filterEmpty(typ, number, name), " ")
	return m, tea.Batch(
		flash(fmt.Sprintf("Timer started: %s", label)),
		done(),
	)
}

func filterEmpty(parts ...string) []string {
	var result []string
	for _, p := range parts {
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

func (m *Model) View() string {
	var b strings.Builder
	b.WriteString(appTui.TitleStyle.Render("Start Timer") + "\n")
	b.WriteString(appTui.HintStyle.Render("Type or paste task. Enter=start, Escape=cancel") + "\n")
	b.WriteString(appTui.HintStyle.Render("Example: Bug 123: Fix login") + "\n\n")
	b.WriteString(m.input.View() + "\n")
	return b.String()
}

func done() tea.Cmd {
	return func() tea.Msg { return appTui.DoneMsg{} }
}

func flash(text string) tea.Cmd {
	return func() tea.Msg { return appTui.FlashMsg{Text: text} }
}
