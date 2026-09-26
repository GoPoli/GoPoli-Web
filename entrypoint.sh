#!/bin/sh
set -e

APP_DIR="/app"
SOURCE_DIR="$APP_DIR/.next-build"
BUILD_DIR="$APP_DIR/.next"
ENVMAP_FILE="$APP_DIR/runtime.envmap"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "No se encontró la compilación en $SOURCE_DIR"
  exit 1
fi

if [ ! -f "$ENVMAP_FILE" ]; then
  echo "No se encontró el mapa de variables en $ENVMAP_FILE"
  exit 1
fi

echo "Preparando la compilación para este entorno..."
rm -rf "${BUILD_DIR:?}/"*
cp -R "$SOURCE_DIR/." "$BUILD_DIR/"

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
    echo "  $env_name no está definida; se usa el valor por defecto"
  fi

  escaped_value="$(printf '%s' "$value" | sed -e 's/[\\|&]/\\&/g')"
  files="$(grep -rlF "$placeholder" "$BUILD_DIR" 2>/dev/null || true)"

  if [ -z "$files" ]; then
    echo "  $env_name: ningún archivo contiene $placeholder"
    continue
  fi

  echo "  $env_name -> $value"
  for file in $files; do
    sed -i "s|$placeholder|$escaped_value|g" "$file"
  done
done < "$ENVMAP_FILE"

echo "Variables de entorno aplicadas. Iniciando GoPoli Web..."

exec "$@"
