import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { executeQuery, executeQuerySingle, executeTransaction } from '../utils/database';
import {
  StaticPage,
  BlogPost,
  Category,
  CreateStaticPageData,
  UpdateStaticPageData,
  CreateBlogPostData,
  UpdateBlogPostData,
  CreateCategoryData,
  UpdateCategoryData,
  ContentQueryParams,
  PaginatedResponse
} from '../models/Content';

// ==================== STATIC PAGES ====================

/**
 * Get all static pages with pagination and filtering
 */
export const getStaticPages = [
  // Validation rules
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('is_published').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        is_published
      }: ContentQueryParams = req.query as any;

      const offset = (page - 1) * limit;

      // Build query
      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex + 1})`;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
      }

      if (is_published !== undefined) {
        whereClause += ` AND is_published = $${paramIndex}`;
        params.push(is_published);
        paramIndex++;
      }

      // Get total count
      const countResult = await executeQuerySingle<{ count: number }>(
        `SELECT COUNT(*) as count FROM static_pages WHERE ${whereClause}`,
        params
      );

      if (!countResult) {
        res.status(500).json({
          success: false,
          error: 'Database error: Unable to count pages'
        });
        return;
      }

      // Get pages
      const pages = await executeQuery<StaticPage>(
        `SELECT * FROM static_pages
         WHERE ${whereClause}
         ORDER BY updated_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const response: PaginatedResponse<StaticPage> = {
        data: pages,
        pagination: {
          page,
          limit,
          total: countResult.count,
          total_pages: Math.ceil(countResult.count / limit),
          has_next: page * limit < countResult.count,
          has_prev: page > 1,
        },
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get static pages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Get a single static page by slug
 */
export const getStaticPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const page = await executeQuerySingle<StaticPage>(
      'SELECT * FROM static_pages WHERE slug = $1',
      [slug]
    );

    if (!page) {
      res.status(404).json({
        success: false,
        error: 'Static page not found',
      });
      return;
    }

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Get static page error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new static page
 */
export const createStaticPage = [
  // Validation rules
  body('slug').trim().isLength({ min: 1, max: 255 }).matches(/^[a-z0-9-]+$/),
  body('title').trim().isLength({ min: 1, max: 500 }),
  body('content').trim().isLength({ min: 1 }),
  body('seo_title').optional().trim().isLength({ max: 500 }),
  body('seo_description').optional().trim(),
  body('meta_keywords').optional().trim(),
  body('is_published').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { slug, title, content, seo_title, seo_description, meta_keywords, is_published = false }: CreateStaticPageData = req.body;
      const userId = req.user!.id;

      // Check if slug already exists
      const existingPage = await executeQuerySingle<StaticPage>(
        'SELECT id FROM static_pages WHERE slug = $1',
        [slug]
      );

      if (existingPage) {
        res.status(409).json({
          success: false,
          error: 'Slug already exists',
        });
        return;
      }

      // Create page
      const newPage = await executeQuerySingle<StaticPage>(
        `INSERT INTO static_pages (slug, title, content, seo_title, seo_description, meta_keywords, is_published, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
         RETURNING *`,
        [slug, title, content, seo_title, seo_description, meta_keywords, is_published, userId]
      );

      res.status(201).json({
        success: true,
        message: 'Static page created successfully',
        data: newPage,
      });
    } catch (error) {
      console.error('Create static page error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Update a static page
 */
export const updateStaticPage = [
  // Validation rules
  body('slug').optional().trim().isLength({ min: 1, max: 255 }).matches(/^[a-z0-9-]+$/),
  body('title').optional().trim().isLength({ min: 1, max: 500 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('seo_title').optional().trim().isLength({ max: 500 }),
  body('seo_description').optional().trim(),
  body('meta_keywords').optional().trim(),
  body('is_published').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { slug, title, content, seo_title, seo_description, meta_keywords, is_published } = req.body;
      const userId = req.user.id;

      // Check if slug conflicts with another page
      if (slug) {
        const existingPage = await executeQuerySingle<StaticPage>(
          'SELECT id FROM static_pages WHERE slug = $1 AND id != $2',
          [slug, id]
        );

        if (existingPage) {
          res.status(409).json({
            success: false,
            error: 'Slug already exists',
          });
          return;
        }
      }

      // Update page
      const updatedPage = await executeQuerySingle<StaticPage>(
        `UPDATE static_pages
         SET slug = COALESCE($1, slug),
             title = COALESCE($2, title),
             content = COALESCE($3, content),
             seo_title = COALESCE($4, seo_title),
             seo_description = COALESCE($5, seo_description),
             meta_keywords = COALESCE($6, meta_keywords),
             is_published = COALESCE($7, is_published),
             updated_by = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [slug, title, content, seo_title, seo_description, meta_keywords, is_published, userId, id]
      );

      if (!updatedPage) {
        res.status(404).json({
          success: false,
          error: 'Static page not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Static page updated successfully',
        data: updatedPage,
      });
    } catch (error) {
      console.error('Update static page error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Delete a static page
 */
export const deleteStaticPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedPage = await executeQuerySingle<StaticPage>(
      'DELETE FROM static_pages WHERE id = $1 RETURNING *',
      [id]
    );

    if (!deletedPage) {
      res.status(404).json({
        success: false,
        error: 'Static page not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Static page deleted successfully',
    });
  } catch (error) {
    console.error('Delete static page error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// ==================== BLOG POSTS ====================

/**
 * Get all blog posts with pagination and filtering
 */
export const getBlogPosts = [
  // Validation rules
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('category_id').optional().isUUID(),
  query('is_published').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        category_id,
        is_published
      }: ContentQueryParams = req.query as any;

      const offset = (page - 1) * limit;

      // Build query
      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex + 1} OR excerpt ILIKE $${paramIndex + 2})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIndex += 3;
      }

      if (category_id) {
        whereClause += ` AND category_id = $${paramIndex}`;
        params.push(category_id);
        paramIndex++;
      }

      if (is_published !== undefined) {
        whereClause += ` AND is_published = $${paramIndex}`;
        params.push(is_published);
        paramIndex++;
      }

      // Get total count
      const countResult = await executeQuerySingle<{ count: number }>(
        `SELECT COUNT(*) as count FROM blog_posts WHERE ${whereClause}`,
        params
      );

      if (!countResult) {
        res.status(500).json({
          success: false,
          error: 'Database error: Unable to count blog posts'
        });
        return;
      }

      // Get posts with category information
      const posts = await executeQuery<BlogPost & { category_name?: string; category_slug?: string }>(
        `SELECT bp.*, c.name as category_name, c.slug as category_slug
         FROM blog_posts bp
         LEFT JOIN categories c ON bp.category_id = c.id
         WHERE ${whereClause}
         ORDER BY bp.published_at DESC NULLS LAST, bp.updated_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const response: PaginatedResponse<BlogPost & { category_name?: string; category_slug?: string }> = {
        data: posts,
        pagination: {
          page,
          limit,
          total: countResult.count,
          total_pages: Math.ceil(countResult.count / limit),
          has_next: page * limit < countResult.count,
          has_prev: page > 1,
        },
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get blog posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Get a single blog post by slug
 */
export const getBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const post = await executeQuerySingle<BlogPost & { category_name?: string; category_slug?: string }>(
      `SELECT bp.*, c.name as category_name, c.slug as category_slug
       FROM blog_posts bp
       LEFT JOIN categories c ON bp.category_id = c.id
       WHERE bp.slug = $1`,
      [slug]
    );

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new blog post
 */
export const createBlogPost = [
  // Validation rules
  body('slug').trim().isLength({ min: 1, max: 255 }).matches(/^[a-z0-9-]+$/),
  body('title').trim().isLength({ min: 1, max: 500 }),
  body('content').trim().isLength({ min: 1 }),
  body('excerpt').optional().trim(),
  body('featured_image').optional().trim(),
  body('seo_title').optional().trim().isLength({ max: 500 }),
  body('seo_description').optional().trim(),
  body('meta_keywords').optional().trim(),
  body('category_id').optional().isUUID(),
  body('tags').optional().isArray(),
  body('is_published').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {
        slug,
        title,
        content,
        excerpt,
        featured_image,
        seo_title,
        seo_description,
        meta_keywords,
        category_id,
        tags = [],
        is_published = false
      }: CreateBlogPostData = req.body;
      const userId = req.user.id;

      // Check if slug already exists
      const existingPost = await executeQuerySingle<BlogPost>(
        'SELECT id FROM blog_posts WHERE slug = $1',
        [slug]
      );

      if (existingPost) {
        res.status(409).json({
          success: false,
          error: 'Slug already exists',
        });
        return;
      }

      // Verify category exists if provided
      if (category_id) {
        const category = await executeQuerySingle<Category>(
          'SELECT id FROM categories WHERE id = $1 AND is_active = true',
          [category_id]
        );

        if (!category) {
          res.status(400).json({
            success: false,
            error: 'Invalid category',
          });
          return;
        }
      }

      // Create post
      const publishedAt = is_published ? new Date() : null;
      const newPost = await executeQuerySingle<BlogPost>(
        `INSERT INTO blog_posts (slug, title, content, excerpt, featured_image, seo_title, seo_description, meta_keywords, category_id, tags, is_published, published_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
         RETURNING *`,
        [slug, title, content, excerpt, featured_image, seo_title, seo_description, meta_keywords, category_id, tags, is_published, publishedAt, userId]
      );

      res.status(201).json({
        success: true,
        message: 'Blog post created successfully',
        data: newPost,
      });
    } catch (error) {
      console.error('Create blog post error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Update a blog post
 */
export const updateBlogPost = [
  // Validation rules
  body('slug').optional().trim().isLength({ min: 1, max: 255 }).matches(/^[a-z0-9-]+$/),
  body('title').optional().trim().isLength({ min: 1, max: 500 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('excerpt').optional().trim(),
  body('featured_image').optional().trim(),
  body('seo_title').optional().trim().isLength({ max: 500 }),
  body('seo_description').optional().trim(),
  body('meta_keywords').optional().trim(),
  body('category_id').optional().isUUID(),
  body('tags').optional().isArray(),
  body('is_published').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const {
        slug,
        title,
        content,
        excerpt,
        featured_image,
        seo_title,
        seo_description,
        meta_keywords,
        category_id,
        tags,
        is_published
      } = req.body;
      const userId = req.user.id;

      // Check if slug conflicts with another post
      if (slug) {
        const existingPost = await executeQuerySingle<BlogPost>(
          'SELECT id FROM blog_posts WHERE slug = $1 AND id != $2',
          [slug, id]
        );

        if (existingPost) {
          res.status(409).json({
            success: false,
            error: 'Slug already exists',
          });
          return;
        }
      }

      // Verify category exists if provided
      if (category_id) {
        const category = await executeQuerySingle<Category>(
          'SELECT id FROM categories WHERE id = $1 AND is_active = true',
          [category_id]
        );

        if (!category) {
          res.status(400).json({
            success: false,
            error: 'Invalid category',
          });
          return;
        }
      }

      // Update post
      const publishedAt = is_published !== undefined && is_published ? new Date() : undefined;
      const updatedPost = await executeQuerySingle<BlogPost>(
        `UPDATE blog_posts
         SET slug = COALESCE($1, slug),
             title = COALESCE($2, title),
             content = COALESCE($3, content),
             excerpt = COALESCE($4, excerpt),
             featured_image = COALESCE($5, featured_image),
             seo_title = COALESCE($6, seo_title),
             seo_description = COALESCE($7, seo_description),
             meta_keywords = COALESCE($8, meta_keywords),
             category_id = COALESCE($9, category_id),
             tags = COALESCE($10, tags),
             is_published = COALESCE($11, is_published),
             published_at = COALESCE($12, published_at),
             updated_by = $13,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $14
         RETURNING *`,
        [slug, title, content, excerpt, featured_image, seo_title, seo_description, meta_keywords, category_id, tags, is_published, publishedAt, userId, id]
      );

      if (!updatedPost) {
        res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Blog post updated successfully',
        data: updatedPost,
      });
    } catch (error) {
      console.error('Update blog post error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Delete a blog post
 */
export const deleteBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedPost = await executeQuerySingle<BlogPost>(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING *',
      [id]
    );

    if (!deletedPost) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// ==================== CATEGORIES ====================

/**
 * Get all categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await executeQuery<Category>(
      'SELECT * FROM categories WHERE is_active = true ORDER BY name'
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single category by slug
 */
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await executeQuerySingle<Category>(
      'SELECT * FROM categories WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new category
 */
export const createCategory = [
  // Validation rules
  body('slug').trim().isLength({ min: 1, max: 255 }).matches(/^[a-z0-9-]+$/),
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { slug, name, description, color = '#6B7280' }: CreateCategoryData = req.body;
      const userId = req.user.id;

      // Check if slug already exists
      const existingCategory = await executeQuerySingle<Category>(
        'SELECT id FROM categories WHERE slug = $1',
        [slug]
      );

      if (existingCategory) {
        res.status(409).json({
          success: false,
          error: 'Slug already exists',
        });
        return;
      }

      // Create category
      const newCategory = await executeQuerySingle<Category>(
        `INSERT INTO categories (slug, name, description, color, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5)
         RETURNING *`,
        [slug, name, description, color, userId]
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory,
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Update a category
 */
export const updateCategory = [
  // Validation rules
  body('slug').optional().trim().isLength({ min: 1, max: 255 }).matches(/^[a-z0-9-]+$/),
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('is_active').optional().isBoolean(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { slug, name, description, color, is_active } = req.body;
      const userId = req.user.id;

      // Check if slug conflicts with another category
      if (slug) {
        const existingCategory = await executeQuerySingle<Category>(
          'SELECT id FROM categories WHERE slug = $1 AND id != $2',
          [slug, id]
        );

        if (existingCategory) {
          res.status(409).json({
            success: false,
            error: 'Slug already exists',
          });
          return;
        }
      }

      // Update category
      const updatedCategory = await executeQuerySingle<Category>(
        `UPDATE categories
         SET slug = COALESCE($1, slug),
             name = COALESCE($2, name),
             description = COALESCE($3, description),
             color = COALESCE($4, color),
             is_active = COALESCE($5, is_active),
             updated_by = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [slug, name, description, color, is_active, userId, id]
      );

      if (!updatedCategory) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Delete a category
 */
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category has associated posts
    const postCount = await executeQuerySingle<{ count: number }>(
      'SELECT COUNT(*) as count FROM blog_posts WHERE category_id = $1',
      [id]
    );

    if (postCount.count > 0) {
      res.status(409).json({
        success: false,
        error: 'Cannot delete category with associated posts',
        message: 'Please reassign or delete the associated posts first',
      });
      return;
    }

    const deletedCategory = await executeQuerySingle<Category>(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (!deletedCategory) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};


