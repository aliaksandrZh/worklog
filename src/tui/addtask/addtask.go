package addtask

import (
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"github.com/aliaksandrZh/worklog/src/internal/model"
	"github.com/aliaksandrZh/worklog/src/internal/store"
	appTui "github.com/aliaksandrZh/worklog/src/tui"
)

type field struct {
	key      string
	label    string
	optional bool
	defVal   func() string
}

var fields = []field{
	{key: "date", label: "Date (M/D/YYYY)", defVal: func() string {
		now := time.Now()
		return fmt.Sprintf("%d/%d/%d", now.Month(), now.Day(), now.Year())
	}},
	{key: "type", label: "Type (Bug/Task)"},
	{key: "number", label: "Number"},
	{key: "name", label: "Name"},
	{key: "timeSpent", label: "Time Spent?", optional: true},
	{key: "comments", label: "Comments?", optional: true},
}

// Model is the add task form.
type Model struct {
	step    int
	values  map[string]string
	input   textinput.Model
	repo    store.TaskRepository
}

// New creates a new add task model.
func New(repo store.TaskRepository) *Model {
	ti := textinput.New()
	ti.Focus()
	ti.CharLimit = 200
	m := &Model{
		values: make(map[string]string),
		input:  ti,
		repo:   repo,
	}
	m.updatePlaceholder()
	return m
}

func (m *Model) updatePlaceholder() {
	f := fields[m.step]
	if f.defVal != nil {
		m.input.Placeholder = f.defVal()
	} else {
		m.input.Placeholder = ""
	}
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
		case tea.KeyBackspace:
			if m.input.Value() == "" && m.step > 0 {
				m.step--
				m.input.SetValue(m.values[fields[m.step].key])
				m.updatePlaceholder()
				return m, nil
			}
		case tea.KeyEnter:
			return m.submit()
		}
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m *Model) submit() (appTui.ScreenModel, tea.Cmd) {
	f := fields[m.step]
	val := m.input.Value()
	if val == "" && f.defVal != nil {
		val = f.defVal()
	}
	m.values[f.key] = val
	m.input.SetValue("")

	if m.step+1 >= len(fields) {
		// Save task
		task := model.Task{
			Date:      m.values["date"],
			Type:      m.values["type"],
			Number:    m.values["number"],
			Name:      m.values["name"],
			TimeSpent: m.values["timeSpent"],
			Comments:  m.values["comments"],
		}
		_ = m.repo.AddTask(task)
		return m, tea.Batch(
			flash("Task added!"),
			done(),
		)
	}

	m.step++
	m.updatePlaceholder()
	return m, nil
}

func (m *Model) View() string {
	var b strings.Builder
	b.WriteString(appTui.TitleStyle.Render("Add Task") + "\n")
	b.WriteString(appTui.HintStyle.Render("Escape=cancel | Backspace on empty=go back | ?=optional") + "\n")

	// Show completed fields
	for i := 0; i < m.step; i++ {
		f := fields[i]
		b.WriteString(fmt.Sprintf("  %s: %s\n", f.key, m.values[f.key]))
	}

	// Current field
	f := fields[m.step]
	label := f.label
	if f.defVal != nil {
		label += fmt.Sprintf(" [%s]", f.defVal())
	}
	b.WriteString("\n")
	b.WriteString(appTui.PromptStyle.Render(label+": ") + m.input.View() + "\n")

	return b.String()
}

func done() tea.Cmd {
	return func() tea.Msg { return appTui.DoneMsg{} }
}

func flash(text string) tea.Cmd {
	return func() tea.Msg { return appTui.FlashMsg{Text: text} }
}
