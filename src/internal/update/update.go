package update

import (
	"context"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

// CheckForUpdates checks if the local branch is behind the remote.
// Returns the number of commits behind, or 0 on any error.
func CheckForUpdates() int {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := exec.CommandContext(ctx, "git", "fetch", "--quiet").Run(); err != nil {
		return 0
	}

	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()

	out, err := exec.CommandContext(ctx2, "git", "rev-list", "--count", "HEAD..@{u}").Output()
	if err != nil {
		return 0
	}

	n, err := strconv.Atoi(strings.TrimSpace(string(out)))
	if err != nil {
		return 0
	}
	return n
}
