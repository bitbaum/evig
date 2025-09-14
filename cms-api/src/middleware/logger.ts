import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  console.log(`📨 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);

  // Log request body for POST/PUT/PATCH (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';

    console.log('📝 Request Body:', JSON.stringify(sanitizedBody, null, 2));
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 200 && status < 300 ? '✅' :
                       status >= 300 && status < 400 ? '🔄' :
                       status >= 400 && status < 500 ? '⚠️' : '❌';

    console.log(`${statusEmoji} ${req.method} ${req.url} - ${status} - ${duration}ms`);
  });

  next();
};



