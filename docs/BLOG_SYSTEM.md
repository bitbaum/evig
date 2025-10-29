# Blog System Documentation

## Overview

The RevampIt blog is a **git-based, TinaCMS-powered blogging system** with user-generated content submission capabilities. It's designed to be simple, maintainable, and scalable.

## Architecture

### Technology Stack
- **CMS**: TinaCMS (file-based, git-backed)
- **Content Format**: Markdown with frontmatter
- **Storage**: File system (no database needed)
- **Styling**: Tailwind CSS (Medium-inspired)
- **Framework**: Next.js 14 (App Router)

## File Structure

```
src/
├── app/
│   ├── blog/
│   │   ├── page.tsx                    # Blog listing page (~230 lines)
│   │   ├── [slug]/page.tsx             # Blog post page (~65 lines) ✅
│   │   ├── submit/page.tsx             # User submission form
│   │   └── admin/submissions/page.tsx  # Admin review interface
│   └── api/
│       └── blog/submit/route.ts        # Submission API (~70 lines) ✅
│
├── components/blog/                     # Modular blog components ✅
│   ├── BlogPostHeader.tsx              # Post header (~40 lines)
│   ├── BlogPostContent.tsx             # Post content with Medium styling (~120 lines)
│   ├── ShareButtons.tsx                # Share buttons (~35 lines)
│   └── RelatedPosts.tsx                # Related posts grid (~50 lines)
│
├── lib/
│   └── blog.ts                         # Blog utility functions (~80 lines) ✅
│
└── tina/
    └── config.ts                       # TinaCMS configuration

content/
├── posts/                              # Published blog posts (markdown)
│   └── hello-world.md
└── submissions/                        # User submissions (JSON)
    └── README.md
```

## Key Design Principles

### 1. **Modular Components**
Each component has a single responsibility:
- `BlogPostHeader`: Displays post metadata and title
- `BlogPostContent`: Renders markdown with Medium-style typography
- `ShareButtons`: Social sharing functionality
- `RelatedPosts`: Shows related articles

### 2. **Clean Separation of Concerns**
- **Pages**: Route handling and data fetching
- **Components**: Presentation and UI
- **Lib**: Business logic and utilities
- **API**: Backend operations

### 3. **File Size Guidelines**
- Keep components under 150 lines
- Pages should be under 100 lines (orchestration only)
- Extract reusable logic to `/lib`
- Extract large components to `/components`

## Content Management

### For Admins (Publishing Content)

1. **Using TinaCMS**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/admin
   # Click "Posts" → "Create new post"
   ```

2. **Direct Markdown**:
   ```bash
   # Create file: content/posts/my-post.md
   # Add frontmatter and content
   # Commit to git
   ```

### For Users (Submitting Content)

1. Visit `/blog/submit`
2. Choose "Post-Idee" or "Vollständiger Entwurf"
3. Fill form and submit
4. Admin reviews at `/blog/admin/submissions`
5. Admin downloads markdown and publishes via TinaCMS

## Styling Philosophy

### Medium-Inspired Readability

The blog follows Medium's proven design principles:

```
- Font size: 21px (body text)
- Line height: 1.58
- Max width: 680px
- Font: Serif for body, Sans-serif for UI
- Colors: High contrast (black on white)
- Spacing: Generous whitespace
```

### Implementation

```tsx
// Clean, semantic styling
<p className="text-[21px] text-gray-800 leading-[1.58] mb-8 font-serif">
  Content here...
</p>
```

## Workflow

### Publishing a Post

```mermaid
User writes → TinaCMS → Markdown file → Git → Deploy → Live
```

### User Submission

```mermaid
User submits → API endpoint → JSON file → Admin reviews → Downloads MD → TinaCMS → Publish
```

## API Endpoints

### `POST /api/blog/submit`
Accepts user submissions

**Request**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "title": "Post Title",
  "category": "Category",
  "tags": ["tag1", "tag2"],
  "content": "Post content...",
  "submissionType": "idea" | "draft"
}
```

**Response**:
```json
{
  "success": true,
  "id": "1234567890",
  "message": "Submission received"
}
```

### `GET /api/blog/submit`
Retrieves all submissions (admin only)

## Utilities

### `src/lib/blog.ts`

```typescript
// Get all published posts
const posts = getAllPosts()

// Get specific post
const post = getPostBySlug('my-post')

// Format date
const formatted = formatDate('2025-10-20')
```

## Scaling Considerations

### Current Capacity
- **Posts**: Unlimited (file-based)
- **Performance**: Fast (static generation)
- **Build time**: ~1s per 100 posts

### If You Need to Scale

1. **Add pagination** (>50 posts):
   ```typescript
   // In blog page
   const pageSize = 12
   const currentPage = 1
   const paginatedPosts = posts.slice(0, pageSize)
   ```

2. **Add search**:
   ```typescript
   // Create search API endpoint
   // Use lunr.js or algolia
   ```

3. **Add categories/tags pages**:
   ```typescript
   // Create /blog/category/[category]/page.tsx
   // Filter posts by category
   ```

## Maintenance Tasks

### Regular
- Review submissions: `/blog/admin/submissions`
- Check broken links
- Update images

### Monthly
- Review analytics
- Clean up old submissions
- Update categories if needed

## Future Enhancements

### Planned
- [ ] Email notifications for submissions
- [ ] RSS feed
- [ ] Search functionality
- [ ] Reading time estimates
- [ ] Comments system (optional)

### Not Planned (Keep it Simple!)
- ❌ Database (files work great)
- ❌ Complex CMS (TinaCMS is perfect)
- ❌ Multiple authors with permissions
- ❌ Draft/publish workflows (TinaCMS handles this)

## Troubleshooting

### Blog post not showing
1. Check `published: true` in frontmatter
2. Verify file is in `content/posts/`
3. Check filename ends in `.md`

### Styling looks broken
1. Ensure Tailwind is compiling
2. Check for conflicting CSS
3. Verify prose classes are applied

### Submissions not working
1. Check API endpoint is running
2. Verify `content/submissions/` directory exists
3. Check file permissions

## Best Practices

### Content
- Keep posts focused (one topic)
- Use clear headings
- Add relevant tags
- Write compelling excerpts

### Code
- Keep components small (<150 lines)
- Extract reusable logic
- Write descriptive variable names
- Comment complex logic

### Performance
- Optimize images
- Use Next.js Image component
- Keep bundle size small

## Resources

- [TinaCMS Docs](https://tina.io/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Markdown Guide](https://www.markdownguide.org/)

---

**Last Updated**: 2025-10-20
**Maintainer**: RevampIt Development Team
