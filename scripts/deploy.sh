#!/usr/bin/env bash
# Git Bash 兼容入口：真正的发布逻辑统一由 PowerShell 脚本维护。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$SCRIPT_DIR/release.ps1" "$@"
