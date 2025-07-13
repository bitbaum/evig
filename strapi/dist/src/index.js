"use strict";
// import type { Core } from '@strapi/strapi';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    /**
     * An asynchronous register function that runs before
     * your application is initialized.
     *
     * This gives you an opportunity to extend code.
     */
    register( /*{ strapi }*/) { },
    /**
     * An asynchronous bootstrap function that runs before
     * your application gets started.
     *
     * This gives you an opportunity to set up your data model,
     * run jobs, or perform some special logic.
     */
    async bootstrap({ strapi }) {
        // Grant full access to the Super Admin role
        const superAdminRole = await strapi.db.query('admin::role').findOne({
            where: { code: 'strapi-super-admin' },
        });
        if (superAdminRole) {
            const allPermissions = await strapi.db.query('admin::permission').findMany();
            await strapi.db.query('admin::role').update({
                where: { id: superAdminRole.id },
                data: {
                    permissions: allPermissions.map((p) => p.id),
                },
            });
            console.log('Super admin permissions have been set.');
        }
        // Grant public access to blog posts and static pages
        const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'public' },
            populate: ['permissions'],
        });
        if (publicRole) {
            const permissionsToGrant = [
                'api::blog-post.blog-post.find',
                'api::blog-post.blog-post.findOne',
                'api::static-page.static-page.find',
                'api::static-page.static-page.findOne',
            ];
            const permissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
                where: {
                    action: {
                        $in: permissionsToGrant,
                    },
                },
            });
            await strapi.db.query('plugin::users-permissions.role').update({
                where: { id: publicRole.id },
                data: {
                    permissions: [...new Set([...(publicRole.permissions || []).map((p) => p.id), ...permissions.map((p) => p.id)])],
                },
            });
            console.log('Public permissions have been set for blog posts and static pages.');
        }
    },
};
