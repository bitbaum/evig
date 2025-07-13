# Strapi CMS Setup Guide

Your website is now ready to use Strapi CMS for content management! Follow these steps to get everything working.

## 🚨 If Strapi Admin Shows "Loading content..." Forever

Run this fix command:
```bash
./scripts/fix-strapi.sh
```

Or manually:
```bash
# Stop Strapi, clear cache, restart
pkill -f "strapi develop"
cd strapi && rm -rf dist/ .cache/ && npm run dev
```

## 🚀 Quick Setup Steps

### 1. Enable API Permissions in Strapi Admin

1. **Open Strapi Admin**: http://localhost:1337/admin
2. **Go to Settings** → **Roles & Permissions** → **Public**
3. **Enable these permissions**:
   - **Static-page**: ✅ `find`, ✅ `findOne`
   - **Blog-post**: ✅ `find`, ✅ `findOne`
   - **Category**: ✅ `find`, ✅ `findOne`
   - **Tag**: ✅ `find`, ✅ `findOne`
4. **Click "Save"**

### 2. Run the Migration Script

Once permissions are enabled, populate Strapi with your existing content:

```bash
node migrate-to-strapi.js
```

This will create:
- Your homepage content as a static page
- Your about page content as a static page  
- Sample blog posts to get you started

### 3. Start Creating Content!

#### ✏️ **Write Blog Posts**
- Go to: http://localhost:1337/admin/content-manager/collection-types/api::blog-post.blog-post
- Click "Create new entry"
- Fill in title, content, excerpt, etc.
- Set status to "Published" when ready
- Your posts will automatically appear on your website at `/blog`

#### 📝 **Edit Static Pages** 
- Go to: http://localhost:1337/admin/content-manager/collection-types/api::static-page.static-page
- Edit existing pages or create new ones
- Changes appear immediately on your website

#### 🏷️ **Manage Categories & Tags**
- Categories: http://localhost:1337/admin/content-manager/collection-types/api::category.category
- Tags: http://localhost:1337/admin/content-manager/collection-types/api::tag.tag

## 🎯 What's Connected

Your website now automatically pulls content from Strapi:

- **Homepage** (`/`) - Uses Strapi static page with slug "home"
- **About page** (`/about`) - Uses Strapi static page with slug "about"  
- **Blog page** (`/blog`) - Shows all published blog posts from Strapi
- **Individual blog posts** (`/blog/[slug]`) - Dynamic pages for each post

## 🔧 Development Workflow

### Running Both Services
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Strapi  
npm run dev:strapi

# OR run both together:
npm run dev:all
```

### Creating New Content
1. **Create in Strapi admin** (http://localhost:1337/admin)
2. **Content appears automatically** on your website
3. **No code changes needed!**

## 📊 Content Types Available

### Blog Post
- Title, slug, content (rich text)
- Excerpt, featured image
- Author, categories, tags
- SEO fields, view count
- Draft/published status

### Static Page  
- Title, slug, content (rich text)
- Excerpt, featured image
- Page type, SEO fields
- Show in navigation option

### Category
- Name, slug, description
- Color coding for display

### Tag
- Name, slug for organization

## 🚨 Troubleshooting

### "No content showing"
- Check API permissions are enabled (step 1 above)
- Verify content is set to "Published" status
- Check browser console for API errors

### "API 404 errors"
- Strapi might not be running: `npm run dev:strapi`
- API permissions not enabled (see step 1)

### "Migration script fails"
- Enable API permissions first (step 1)
- Make sure Strapi is running on port 1337

## 🎉 You're Ready!

Your CMS is now fully integrated. You can:
- ✅ Write blog posts easily in Strapi admin
- ✅ Edit any page content without touching code
- ✅ Manage categories and tags
- ✅ Upload images and media
- ✅ SEO optimization built-in
- ✅ Content appears instantly on your website

Happy blogging! 🚀