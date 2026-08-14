use std::sync::Mutex;
use rusqlite::{Connection, params_from_iter, types::ValueRef};
use serde_json::Value as JsonValue;
use tauri::State;

struct DrizzleDbState {
    conn: Mutex<Option<Connection>>,
}

#[tauri::command]
fn init_drizzle_db(db_path: String, state: State<DrizzleDbState>) -> Result<(), String> {
    let mut conn_guard = state.conn.lock().map_err(|e| e.to_string())?;
    if conn_guard.is_none() {
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;").map_err(|e| e.to_string())?;
        *conn_guard = Some(conn);
    }
    Ok(())
}

#[tauri::command]
fn execute_drizzle_sql(
    sql: String,
    params: Vec<JsonValue>,
    state: State<DrizzleDbState>,
) -> Result<Vec<Vec<JsonValue>>, String> {
    let conn_guard = state.conn.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut sql_params = Vec::new();
    for p in params {
        let val = match p {
            JsonValue::Null => rusqlite::types::Value::Null,
            JsonValue::Bool(b) => rusqlite::types::Value::Integer(if b { 1 } else { 0 }),
            JsonValue::Number(n) => {
                if let Some(i) = n.as_i64() {
                    rusqlite::types::Value::Integer(i)
                } else if let Some(f) = n.as_f64() {
                    rusqlite::types::Value::Real(f)
                } else {
                    rusqlite::types::Value::Null
                }
            },
            JsonValue::String(s) => rusqlite::types::Value::Text(s),
            _ => rusqlite::types::Value::Text(p.to_string()),
        };
        sql_params.push(val);
    }

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let col_count = stmt.column_count();

    if col_count == 0 {
        stmt.execute(params_from_iter(sql_params.iter())).map_err(|e| e.to_string())?;
        return Ok(Vec::new());
    }

    let mut rows = stmt.query(params_from_iter(sql_params.iter())).map_err(|e| e.to_string())?;
    let mut result = Vec::new();

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let mut row_vec = Vec::new();
        for i in 0..col_count {
            let val = row.get_ref(i).map_err(|e| e.to_string())?;
            let json_val = match val {
                ValueRef::Null => JsonValue::Null,
                ValueRef::Integer(i) => JsonValue::Number(serde_json::Number::from(i)),
                ValueRef::Real(f) => {
                    if let Some(n) = serde_json::Number::from_f64(f) {
                        JsonValue::Number(n)
                    } else {
                        JsonValue::Null
                    }
                },
                ValueRef::Text(t) => JsonValue::String(String::from_utf8_lossy(t).into_owned()),
                ValueRef::Blob(b) => JsonValue::Array(b.iter().map(|&byte| JsonValue::Number(serde_json::Number::from(byte))).collect()),
            };
            row_vec.push(json_val);
        }
        result.push(row_vec);
    }

    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    tauri_plugin_sql::Migration {
      version: 1,
      description: "initial_schema",
      sql: include_str!("../../src/core/database/migrations/0000_wild_prowler.sql"),
      kind: tauri_plugin_sql::MigrationKind::Up,
    },
    tauri_plugin_sql::Migration {
      version: 2,
      description: "add_proposal_unscheduled_students",
      sql: include_str!("../../src/core/database/migrations/0001_panoramic_bloodstorm.sql"),
      kind: tauri_plugin_sql::MigrationKind::Up,
    }
  ];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:edutech.db", migrations)
        .build()
    )
    .manage(DrizzleDbState {
      conn: Mutex::new(None),
    })
    .invoke_handler(tauri::generate_handler![
      init_drizzle_db,
      execute_drizzle_sql
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
