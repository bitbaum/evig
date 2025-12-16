"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("./utils/database");
const auth_1 = __importDefault(require("./routes/auth"));
const content_1 = __importDefault(require("./routes/content"));
const admin_1 = __importDefault(require("./routes/admin"));
const suggestions_1 = __importDefault(require("./routes/suggestions"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const swagger_1 = require("./docs/swagger");
const monitoring_1 = require("./utils/monitoring");
const env_1 = require("./utils/env");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: env_1.env.NODE_ENV === 'production'
        ? env_1.env.FRONTEND_URL
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(monitoring_1.monitoring.middleware());
app.use(logger_1.logger);
app.use('/api/', rateLimiter_1.rateLimiter);
app.get('/health', async (req, res) => {
    const metrics = await (0, monitoring_1.getHealthMetrics)();
    res.json(metrics);
});
app.get('/health/simple', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.use('/api-docs', swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs));
app.use('/api/auth', auth_1.default);
app.use('/api/content', content_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/suggestions', suggestions_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});
app.use(errorHandler_1.errorHandler);
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
async function startServer() {
    try {
        await (0, database_1.initializeDatabase)();
        app.listen(env_1.env.PORT, () => {
            console.log(`🚀 RevampIT CMS API running on port ${env_1.env.PORT}`);
            console.log(`📊 Health check: http://localhost:${env_1.env.PORT}/health`);
            console.log(`📊 Simple health: http://localhost:${env_1.env.PORT}/health/simple`);
            console.log(`📚 API Docs: http://localhost:${env_1.env.PORT}/api-docs`);
            console.log(`🔐 Auth endpoints: http://localhost:${env_1.env.PORT}/api/auth`);
            console.log(`📝 Content endpoints: http://localhost:${env_1.env.PORT}/api/content`);
            console.log(`⚙️ Admin endpoints: http://localhost:${env_1.env.PORT}/api/admin`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map