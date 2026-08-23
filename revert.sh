#!/bin/bash
# 1. Revert 0000_wild_prowler.sql
sed -i 's/CREATE TABLE IF NOT EXISTS/CREATE TABLE/g' src/core/database/migrations/0000_wild_prowler.sql
sed -i 's/CREATE UNIQUE INDEX IF NOT EXISTS/CREATE UNIQUE INDEX/g' src/core/database/migrations/0000_wild_prowler.sql

# 2. Revert package.json
sed -i '/"@tauri-apps\/api"/a \    "@tauri-apps/plugin-sql": "^2.4.0",' package.json

# 3. Revert Cargo.toml
sed -i '/rusqlite = /a tauri-plugin-sql = { version = "2", features = ["sqlite"] }' src-tauri/Cargo.toml

# 4. Revert default.json
sed -i 's/"core:default"/"core:default",\n    "sql:default",\n    "sql:allow-execute"/g' src-tauri/capabilities/default.json

