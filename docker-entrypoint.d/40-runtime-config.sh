#!/bin/sh
set -eu

: "${API_URL:?API_URL debe estar definida}"
: "${STORAGE_URL:?STORAGE_URL debe estar definida}"

cat > /usr/share/nginx/html/runtime-config.js <<EOF
globalThis.__AYUDAYA_RUNTIME_CONFIG__ = {
  apiUrl: '${API_URL}',
  storageUrl: '${STORAGE_URL}',
};
EOF
