/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://revamp-it.ch',
  // Do NOT generate robots.txt — public/robots.txt is the SSOT (security
  // Disallows for /admin/, /api/, /dashboard/, /auth/). next-sitemap's
  // auto-generated version overwrites those Disallows and uses the wrong
  // host, so we ship our own committed robots.txt instead.
  generateRobotsTxt: false,
  generateIndexSitemap: false,
}
