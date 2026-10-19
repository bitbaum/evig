# Blog System Documentation

## Overview

The evig blog merges two sources into one public list, and runs user
submissions through a staff review in the database. There is no external CMS.

## Where posts come from

| Source | Authored by | Read by |
|---|---|---|
| Markdown files in `content/posts/` (`<slug>.md` is German, `<slug>.<locale>.md` a translation) | developers and agents, via git | `src/lib/blog.ts` |
| `blog_posts` table (+ `blog_post_translations` per locale, `blog_categories`, `blog_hidden_slugs`) | staff, in the admin UI | `src/lib/blog-db.ts` |

`getMergedPosts(locale)` in `src/lib/blog-merge.ts` is the one read layer:
it merges both, dedupes by slug (on a collision the DB post wins), drops hidden
slugs and sorts by publication date. Locales fall back to German, like the rest
of the site. Who may see a post is `src/lib/blog-access.ts`; unlisted posts are
unlocked through `src/lib/blog-unlisted-auth.ts`.

## Pages

- `src/app/[locale]/blog/(index)/page.tsx` — listing, search, categories, pagination (`BLOG_PAGE_SIZE` in `src/config/blog.ts`)
- `src/app/[locale]/blog/[slug]/page.tsx` — post page (header, content, comments, related posts, prev/next); retired slugs redirect via `RETIRED_POST_REDIRECTS` in `src/config/blog.ts`
- `src/app/[locale]/blog/submit/page.tsx` — submission form
- `src/app/dashboard/blog-submissions/page.tsx` — a user's own submissions
- `src/app/admin/content/blog/` — staff: posts, new post, comments
- `src/app/admin/content/submissions/page.tsx` — staff: review queue

Components live in `src/components/blog/`.

## Submission and approval flow

```
User submits → blog_submissions (pending) → staff review → approved / rejected / changes requested
                                                         → publish → blog_posts
```

- Public submission: `POST /api/public/blog/submit` (rate limited, no CSRF, so anonymous visitors can submit)
- Signed-in users: `GET /api/blog/my-submissions`, `POST /api/blog/submissions/[id]/resubmit`
- Staff: `/api/admin/blog/*` and `/api/admin/blog/submissions/[id]`
- Review actions (approve, reject, publish, request changes, edit) are in `src/lib/services/blog-submission.ts`; statuses come from `src/config/approval-status.ts`
- Tables: migrations `019_blog_submissions.sql` and `034_admin_edit_submissions.sql`

Translations of DB posts are generated from the admin (`/api/admin/blog/[id]/translate`, `src/lib/services/blog-translate.ts`).

## Writing a file-based post

1. Add `content/posts/<slug>.md` with frontmatter (`title`, `excerpt`, `author`, `category`, `tags`, `publishedAt`, `published` (defaults to true), `visibility`, `audience`, optional `featuredImage`). Only `visibility: public` posts are listed.
2. Optional translations: `content/posts/<slug>.en.md` etc.
3. Commit and push; it appears after the deploy.

## Troubleshooting

### A post does not appear
1. File posts: check `published` and `visibility`. DB posts: check `is_published` and that `published_at` is not in the future.
2. Check that its slug is not in `blog_hidden_slugs`.
3. A DB post with the same slug overrides the file.

### Submissions not working
1. Check the `blog_submissions` table exists (migration `019_blog_submissions.sql`).
2. Check the rate limit has not been hit for that client.
3. Check the server log for the `POST /api/public/blog/submit` error.
