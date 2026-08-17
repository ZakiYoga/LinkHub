package service

import (
	"sync"
	"time"
)

type PinRateLimiter struct {
	mu    sync.Mutex
	state map[string]*pinAttemptState
}
type pinAttemptState struct {
	failures    int
	lockedUntil time.Time
}

const (
	maxPinAttempts = 3
	pinLockFor     = 30 * time.Minute
)

func NewPinRateLimiter() *PinRateLimiter {
	return &PinRateLimiter{state: make(map[string]*pinAttemptState)}
}

func (r *PinRateLimiter) IsLocked(key string) (bool, time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.state[key]
	if !ok {
		return false, 0
	}
	if remaining := time.Until(s.lockedUntil); remaining > 0 {
		return true, remaining
	}
	return false, 0
}

func (r *PinRateLimiter) RecordFailure(key string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.state[key]
	if !ok {
		s = &pinAttemptState{}
		r.state[key] = s
	}
	s.failures++
	if s.failures >= maxPinAttempts {
		s.lockedUntil = time.Now().Add(pinLockFor)
		s.failures = 0
	}
}

func (r *PinRateLimiter) RecordSuccess(key string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.state, key)
}
