import { Router } from 'express';
import {
  // Static Pages
  getStaticPages,
  getStaticPage,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,

  // Blog Posts
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,

  // Categories
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/contentController';
import { authenticateToken, authorizeRole } from '../utils/auth';

const router = Router();

// ==================== STATIC PAGES ====================

// Public routes
router.get('/static-pages', getStaticPages);
router.get('/static-pages/:slug', getStaticPage);

// Protected routes (Editor and Admin)
router.post('/static-pages', authenticateToken, authorizeRole('editor'), createStaticPage);
router.put('/static-pages/:id', authenticateToken, authorizeRole('editor'), updateStaticPage);
router.delete('/static-pages/:id', authenticateToken, authorizeRole('editor'), deleteStaticPage);

// ==================== BLOG POSTS ====================

// Public routes
router.get('/blog-posts', getBlogPosts);
router.get('/blog-posts/:slug', getBlogPost);

// Protected routes (Editor and Admin)
router.post('/blog-posts', authenticateToken, authorizeRole('editor'), createBlogPost);
router.put('/blog-posts/:id', authenticateToken, authorizeRole('editor'), updateBlogPost);
router.delete('/blog-posts/:id', authenticateToken, authorizeRole('editor'), deleteBlogPost);

// ==================== CATEGORIES ====================

// Public routes
router.get('/categories', getCategories);
router.get('/categories/:slug', getCategory);

// Protected routes (Admin only)
router.post('/categories', authenticateToken, authorizeRole('admin'), createCategory);
router.put('/categories/:id', authenticateToken, authorizeRole('admin'), updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeRole('admin'), deleteCategory);

export default router;


