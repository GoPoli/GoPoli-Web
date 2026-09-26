#!/bin/sh
set -e

APP_DIR="/app"
BUILD_DIR="$APP_DIR/.next"
ENVMAP_FILE="$APP_DIR/runtime.envmap"

echo "Starting runtime variable replacement..."

if [ ! -f "$ENVMAP_FILE" ]; then
  echo "Envmap file not found at $ENVMAP_FILE"
  exit 1
fi

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found at $BUILD_DIR"
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ''|\#*) continue ;;
  esac

  env_name="${line%%=*}"
  rest="${line#*=}"
  placeholder="${rest%%|*}"
  default_value="${rest#*|}"

  value="$(printenv "$env_name" || true)"
  if [ -z "$value" ]; then
    value="$default_value"
  fi

  escaped_value="$(printf '%s' "$value" | sed -e 's/[\\|&]/\\&/g')"
  files="$(grep -rlF "$placeholder" "$BUILD_DIR" 2>/dev/null || true)"

  if [ -z "$files" ]; then
    echo "  $env_name: no files contain $placeholder"
    continue
  fi

  echo "  $env_name -> $value"
  for file in $files; do
    sed -i "s|$placeholder|$escaped_value|g" "$file"
  done
done < "$ENVMAP_FILE"

echo "Environment variable replacement completed."

exec "$@"
