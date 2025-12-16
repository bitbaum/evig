import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validateSuggestion = [
  body('suggestion').isLength({ min: 1 }).withMessage('Suggestion is required'),
  body('page').isLength({ min: 1 }).withMessage('Page is required'),
  body('url').isLength({ min: 1 }).withMessage('URL is required'),
  body('pageTitle').isLength({ min: 1 }).withMessage('Page title is required'),
  body('feedbackScope').isIn(['site', 'page', 'element']).withMessage('Invalid feedback scope'),
];

// POST /api/suggestions - Submit a suggestion
router.post('/', validateSuggestion, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const {
      suggestion,
      contact,
      page,
      url,
      pageTitle,
      pageSection,
      feedbackScope,
      selectedElements,
      timestamp
    } = req.body;

    // Log the suggestion (you could save to database here)
    console.log('📝 New suggestion received:', {
      suggestion,
      contact: contact || 'Anonymous',
      page,
      url,
      pageTitle,
      pageSection,
      feedbackScope,
      selectedElementsCount: selectedElements?.length || 0,
      timestamp
    });

    // Here you could save to a suggestions table in the database
    // For now, we'll just log and return success

    res.status(201).json({
      message: 'Suggestion submitted successfully',
      id: `suggestion_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing suggestion:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process suggestion'
    });
  }
});

// GET /api/suggestions - Get all suggestions (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    // In a real implementation, you'd fetch from database
    // For now, return a placeholder response
    res.json({
      suggestions: [],
      message: 'Suggestions endpoint - implement database storage for full functionality'
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch suggestions'
    });
  }
});

export default router;
