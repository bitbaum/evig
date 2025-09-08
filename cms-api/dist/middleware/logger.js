"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger = (req, res, next) => {
    const start = Date.now();
    console.log(`📨 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password)
            sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.token)
            sanitizedBody.token = '[REDACTED]';
        console.log('📝 Request Body:', JSON.stringify(sanitizedBody, null, 2));
    }
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
exports.logger = logger;
//# sourceMappingURL=logger.js.map