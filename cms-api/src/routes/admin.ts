import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getSystemStats,
} from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../utils/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// System statistics
router.get('/stats', getSystemStats);

export default router;



