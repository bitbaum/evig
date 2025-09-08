import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

// Connect to SQLite database
const db = new Database('./db/db.sqlite');

// better-sqlite3 has pragma foreign key constraints
// enabled by default, so we don't need to run it here
// https://github.com/WiseLibs/better-sqlite3/issues/739
// db.prepare(`
//   PRAGMA foreign_keys = ON;
// `).run();

// Initialize sessions table
db.prepare(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
  	user_agent TEXT NOT NULL DEFAULT "",
  	ip TEXT NOT NULL DEFAULT "",
  	created_at TEXT NOT NULL,
  	FOREIGN KEY (user_id) REFERENCES users (id)
  );
`).run();

// Initialize users table with enhanced fields
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    pwhash TEXT NOT NULL,
    role TEXT DEFAULT 'author' NOT NULL,
    full_name TEXT,
    avatar TEXT,
    admin INTEGER DEFAULT 0 NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
  );
`).run();

// Initialize content table for CMS
db.prepare(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft' NOT NULL,
    content_type TEXT DEFAULT 'page' NOT NULL,
    author_id INTEGER NOT NULL,
    editor_id INTEGER,
    published_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id),
    FOREIGN KEY (editor_id) REFERENCES users (id)
  );
`).run();

// Initialize content versions for tracking changes
db.prepare(`
  CREATE TABLE IF NOT EXISTS content_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    version_data TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    change_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES content (id),
    FOREIGN KEY (changed_by) REFERENCES users (id)
  );
`).run();

// Initialize workflow actions
db.prepare(`
  CREATE TABLE IF NOT EXISTS workflow_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    comments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES content (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`).run();

// Initialize media files table
db.prepare(`
  CREATE TABLE IF NOT EXISTS media_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
  );
`).run();

// Add an admin user
const adminUsername = 'admin';
const adminPassword = '1234';
// Hash the password
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get(adminUsername);
if (!adminExists) {
  db.prepare('INSERT INTO users (username, email, pwhash, role, full_name, admin) VALUES (?, ?, ?, ?, ?, ?)')
    .run(adminUsername, 'admin@revampit.ch', hashedPassword, 'admin', 'Administrator', 1);
}

// Add a test author user
const testUsername = 'author';
const testPassword = '1234';
const hashedTestPassword = bcrypt.hashSync(testPassword, 10);
const testUserExists = db.prepare('SELECT * FROM users WHERE username = ?').get(testUsername);
if (!testUserExists) {
  db.prepare('INSERT INTO users (username, email, pwhash, role, full_name, admin) VALUES (?, ?, ?, ?, ?, ?)')
    .run(testUsername, 'author@revampit.ch', hashedTestPassword, 'author', 'Test Author', 0);
}

// Add a test editor user
const editorUsername = 'editor';
const editorPassword = '1234';
const hashedEditorPassword = bcrypt.hashSync(editorPassword, 10);
const editorUserExists = db.prepare('SELECT * FROM users WHERE username = ?').get(editorUsername);
if (!editorUserExists) {
  db.prepare('INSERT INTO users (username, email, pwhash, role, full_name, admin) VALUES (?, ?, ?, ?, ?, ?)')
    .run(editorUsername, 'editor@revampit.ch', hashedEditorPassword, 'editor', 'Test Editor', 0);
}

// test foreign keys by inserting I session with an invalid user id
// const invalidSession = db.prepare(`
//   INSERT INTO sessions (session_id, user_id, expires)
//   VALUES (?, ?, ?);
// `).run('invalid-session-id', 9999, Date.now() + 1000 * 60 * 60 * 24);
