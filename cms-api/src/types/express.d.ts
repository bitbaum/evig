// Extend Express Request interface to include user property
import { AuthToken } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: AuthToken;
    }
  }
}



