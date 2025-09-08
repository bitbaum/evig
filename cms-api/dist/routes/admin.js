"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use((0, auth_1.authorizeRole)('admin'));
router.get('/users', adminController_1.getUsers);
router.get('/users/:id', adminController_1.getUser);
router.post('/users', adminController_1.createUser);
router.put('/users/:id', adminController_1.updateUser);
router.delete('/users/:id', adminController_1.deleteUser);
router.get('/stats', adminController_1.getSystemStats);
exports.default = router;
//# sourceMappingURL=admin.js.map