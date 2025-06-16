package config

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

type GitConfig struct {
	Repository  string `yaml:"repository"`
	Remote      string `yaml:"remote"`
	SshKeyPath  string `yaml:"sshKeyPath"`
	CommitEmail string `yaml:"commitEmail"`
}

type Config struct {
	Server struct {
		Port string `yaml:"port"`
	} `yaml:"server"`
	Git      GitConfig `yaml:"git"`
	Frontend struct {
		EnableProxy bool `yaml:"enable_proxy"`
	} `yaml:"frontend"`
}

var envVarRegexp = regexp.MustCompile(`\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?}`)

func expandEnvVars(s string) string {
	return envVarRegexp.ReplaceAllStringFunc(s, func(m string) string {
		matches := envVarRegexp.FindStringSubmatch(m)
		if len(matches) < 2 {
			return m
		}
		key := matches[1]
		fallback := ""
		if len(matches) > 3 {
			fallback = matches[3]
		}
		val, ok := os.LookupEnv(key)
		if !ok {
			return fallback
		}
		return val
	})
}

func expandAllEnvVars(data []byte) []byte {
	lines := strings.Split(string(data), "\n")
	for i, line := range lines {
		lines[i] = expandEnvVars(line)
	}
	return []byte(strings.Join(lines, "\n"))
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config: %w", err)
	}
	data = expandAllEnvVars(data)
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}
	return &cfg, nil
}
