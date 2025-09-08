import express from 'express'
import { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const port: number = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const cookieName: string = process.env.COOKIE_NAME || 'revamp-backend-session-id';

// DB model

interface User {
  id: number;
  username: string;
  email?: string;
  pwhash: string;
  role: string;
  full_name?: string;
  avatar?: string;
  admin: number;
  created_at?: string;
  last_login?: string;
}

interface Session {
  session_id: string;
  user_id: number;
  created_at: string;
}

interface Content {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  status: string;
  content_type: string;
  author_id: number;
  editor_id?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowAction {
  id: number;
  content_id: number;
  action: string;
  user_id: number;
  comments?: string;
  created_at: string;
}

// Results

interface UserResult {
  id: number;
  username: string;
  email?: string;
  role: string;
  full_name?: string;
  avatar?: string;
  admin: boolean;
  permissions: string[];
  created_at?: string;
  last_login?: string;
}

// Role-based permissions
const ROLE_PERMISSIONS = {
  author: ['create_content', 'edit_own_content', 'submit_for_review', 'view_own_content'],
  editor: ['create_content', 'edit_own_content', 'edit_any_content', 'publish_content', 'reject_content', 'view_all_content'],
  admin: ['create_content', 'edit_own_content', 'edit_any_content', 'publish_content', 'reject_content', 'view_all_content', 'manage_users', 'delete_content', 'manage_system']
};

// Requests

interface LoginRequest {
  username: string;
  password: string;
}

const app = express();
app.use(express.json());
app.use(cookieParser());

// Connect to SQLite database
const db = new Database('./db/db.sqlite');

app.get('/hello', (req, res) => {
    res.send('Hello, this is some text data!');
});

// Hello endpoint
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello, this is some JSON data from the server backend!' });
});

// Login endpoint
app.post('/api/login', async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  const { username, password } = req.body;

  // Validate input
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).send({ message: 'Invalid input: username and password must be strings' });
    return;
  }

  if (!username || !password) {
    res.status(401).send({ message: 'Username and password are required' });
    return;
  }

  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get([username]) as User | undefined;

  if (!user) {
    res.status(401).send({ message: 'Invalid username or password' });
    return;
  }

  try {
    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.pwhash);

    if (!isMatch) {
      res.status(401).send({ message: 'Invalid username or password' });
      return;
    }

    // Update last login
    const now = new Date();
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .run(now.toISOString(), user.id);

    // Generate session ID using UUID v4
    const sessionId = uuidv4();

    const sessionStmt = db.prepare(
      'INSERT INTO sessions (session_id, user_id, created_at) VALUES (?, ?, ?)'
    );
    sessionStmt.run([
      sessionId,
      user.id,
      now.toISOString()
    ]);

    // Set session cookie
    res.cookie(cookieName, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    const userResult: UserResult = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar: user.avatar,
      admin: Boolean(user.admin),
      permissions: ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [],
      created_at: user.created_at,
      last_login: user.last_login
    };

    res.json({
      message: 'Login successful',
      user: userResult
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send({ message: 'An error occurred during login' });
  }
});

// Logout endpoint
app.post('/logout', (req: Request, res: Response): void => {
  const sessionId = req.cookies[cookieName];
  
  if (!sessionId) {
    res.status(401).send({ message: 'Not logged in' });
    return;
  }

  try {
    // Delete the session from the database
    const stmt = db.prepare('DELETE FROM sessions WHERE session_id = ?');
    const result = stmt.run([sessionId]);

    // Clear the session cookie
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send({ message: 'An error occurred during logout' });
  }
});

// Middleware to check if user is logged in
function isLoggedIn(req: Request, res: Response, next: () => void) {
  const sessionId = req.cookies?.[cookieName];

  if (!sessionId) {
    res.status(401).json({ message: 'Not logged in' });
    return;
  }

  try {
    const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
    const session = stmt.get([sessionId]) as Session | undefined;

    if (!session) {
      res.status(401).send({ message: 'Invalid session' });
      return;
    }

    // Get user info and attach to request
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get([session.user_id]) as User | undefined;

    if (!user) {
      res.status(401).send({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).send({ message: 'An error occurred while checking session' });
  }
}

// Middleware to check permissions
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: () => void) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not logged in' });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];
    if (!userPermissions.includes(permission)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Helper function to check if user can edit content
function canEditContent(user: User, content: Content): boolean {
  if (user.role === 'admin' || user.role === 'editor') return true;
  if (user.role === 'author' && content.author_id === user.id) return true;
  return false;
}

// Example protected endpoint
app.get('/api/protected', isLoggedIn, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected endpoint' });
});

// ============================================================================
// CMS CONTENT MANAGEMENT ENDPOINTS
// ============================================================================

// Get all content (with permissions)
app.get('/api/content', isLoggedIn, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let query = 'SELECT * FROM content';
    let params: any[] = [];

    // Authors can only see their own content, editors/admins see all
    if (user.role === 'author') {
      query += ' WHERE author_id = ?';
      params.push(user.id);
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = db.prepare(query);
    const content = stmt.all(...params);

    res.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Error fetching content' });
  }
});

// Get single content by slug (public - for frontend)
app.get('/api/content/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const stmt = db.prepare('SELECT * FROM content WHERE slug = ? AND status = ?');
    const content = stmt.get([slug, 'published']) as Content | undefined;

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Error fetching content' });
  }
});

// Create new content
app.post('/api/content', isLoggedIn, requirePermission('create_content'), (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { title, slug, content, excerpt, content_type = 'page' } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: 'Title and slug are required' });
    }

    // Check if slug already exists
    const existing = db.prepare('SELECT id FROM content WHERE slug = ?').get([slug]);
    if (existing) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO content (title, slug, content, excerpt, content_type, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run([title, slug, content, excerpt, content_type, user.id, now, now]);

    // Create initial version
    const versionStmt = db.prepare(`
      INSERT INTO content_versions (content_id, version_data, changed_by, change_reason)
      VALUES (?, ?, ?, ?)
    `);
    versionStmt.run([result.lastInsertRowid, JSON.stringify({ title, slug, content, excerpt }), user.id, 'Initial creation']);

    res.status(201).json({
      message: 'Content created successfully',
      contentId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ message: 'Error creating content' });
  }
});

// Update content
app.put('/api/content/:id', isLoggedIn, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, slug, content, excerpt } = req.body;

    // Get existing content
    const existingStmt = db.prepare('SELECT * FROM content WHERE id = ?');
    const existingContent = existingStmt.get([id]) as Content | undefined;

    if (!existingContent) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check permissions
    if (!canEditContent(user, existingContent)) {
      return res.status(403).json({ message: 'Cannot edit this content' });
    }

    // Check slug uniqueness if changed
    if (slug !== existingContent.slug) {
      const slugCheck = db.prepare('SELECT id FROM content WHERE slug = ? AND id != ?').get([slug, id]);
      if (slugCheck) {
        return res.status(400).json({ message: 'Slug already exists' });
      }
    }

    const now = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE content SET title = ?, slug = ?, content = ?, excerpt = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run([title, slug, content, excerpt, now, id]);

    // Create version history
    const versionStmt = db.prepare(`
      INSERT INTO content_versions (content_id, version_data, changed_by, change_reason)
      VALUES (?, ?, ?, ?)
    `);
    versionStmt.run([id, JSON.stringify({ title, slug, content, excerpt }), user.id, 'Content updated']);

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Error updating content' });
  }
});

// Submit content for review
app.post('/api/content/:id/submit', isLoggedIn, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const content = db.prepare('SELECT * FROM content WHERE id = ?').get([id]) as Content | undefined;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.author_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Can only submit your own content' });
    }

    // Update status to review
    db.prepare('UPDATE content SET status = ?, updated_at = ? WHERE id = ?')
      .run(['review', new Date().toISOString(), id]);

    // Add workflow action
    db.prepare(`
      INSERT INTO workflow_actions (content_id, action, user_id, comments)
      VALUES (?, ?, ?, ?)
    `).run([id, 'submit', user.id, 'Submitted for review']);

    res.json({ message: 'Content submitted for review' });
  } catch (error) {
    console.error('Error submitting content:', error);
    res.status(500).json({ message: 'Error submitting content' });
  }
});

// Publish content (editor/admin only)
app.post('/api/content/:id/publish', isLoggedIn, requirePermission('publish_content'), (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { comments } = req.body;

    const content = db.prepare('SELECT * FROM content WHERE id = ?').get([id]) as Content | undefined;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE content SET status = ?, editor_id = ?, published_at = ?, updated_at = ? WHERE id = ?')
      .run(['published', user.id, now, now, id]);

    // Add workflow action
    db.prepare(`
      INSERT INTO workflow_actions (content_id, action, user_id, comments)
      VALUES (?, ?, ?, ?)
    `).run([id, 'publish', user.id, comments || 'Content published']);

    res.json({ message: 'Content published successfully' });
  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({ message: 'Error publishing content' });
  }
});

// Reject content (editor/admin only)
app.post('/api/content/:id/reject', isLoggedIn, requirePermission('reject_content'), (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { comments } = req.body;

    const content = db.prepare('SELECT * FROM content WHERE id = ?').get([id]) as Content | undefined;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    db.prepare('UPDATE content SET status = ?, editor_id = ?, updated_at = ? WHERE id = ?')
      .run(['rejected', user.id, new Date().toISOString(), id]);

    // Add workflow action
    db.prepare(`
      INSERT INTO workflow_actions (content_id, action, user_id, comments)
      VALUES (?, ?, ?, ?)
    `).run([id, 'reject', user.id, comments || 'Content rejected']);

    res.json({ message: 'Content rejected' });
  } catch (error) {
    console.error('Error rejecting content:', error);
    res.status(500).json({ message: 'Error rejecting content' });
  }
});

// Get workflow history for content
app.get('/api/content/:id/history', isLoggedIn, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const content = db.prepare('SELECT * FROM content WHERE id = ?').get([id]) as Content | undefined;
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (!canEditContent(user, content) && user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot view history for this content' });
    }

    // Get workflow actions
    const actionsStmt = db.prepare(`
      SELECT wa.*, u.username, u.full_name
      FROM workflow_actions wa
      JOIN users u ON wa.user_id = u.id
      WHERE wa.content_id = ?
      ORDER BY wa.created_at DESC
    `);
    const actions = actionsStmt.all([id]);

    // Get version history
    const versionsStmt = db.prepare(`
      SELECT cv.*, u.username, u.full_name
      FROM content_versions cv
      JOIN users u ON cv.changed_by = u.id
      WHERE cv.content_id = ?
      ORDER BY cv.created_at DESC
    `);
    const versions = versionsStmt.all([id]);

    res.json({ actions, versions });
  } catch (error) {
    console.error('Error fetching content history:', error);
    res.status(500).json({ message: 'Error fetching content history' });
  }
});

// Delete content (admin only)
app.delete('/api/content/:id', isLoggedIn, requirePermission('delete_content'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete workflow actions and versions first (foreign key constraints)
    db.prepare('DELETE FROM workflow_actions WHERE content_id = ?').run([id]);
    db.prepare('DELETE FROM content_versions WHERE content_id = ?').run([id]);
    db.prepare('DELETE FROM content WHERE id = ?').run([id]);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Error deleting content' });
  }
});

// Get current user info
app.get('/api/user', isLoggedIn, (req: Request, res: Response) => {
  const user = req.user!;
  const userResult: UserResult = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    avatar: user.avatar,
    admin: Boolean(user.admin),
    permissions: ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [],
    created_at: user.created_at,
    last_login: user.last_login
  };

  res.json({ user: userResult });
});

app.listen(port, () => {
  console.log(`App listening on port: ${port}`);
});
