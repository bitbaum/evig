import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Use Tina Cloud if credentials are provided; otherwise run in local mode.
  // This lets `tinacms dev` or a local build work without Cloud credentials.
  ...(process.env.NEXT_PUBLIC_TINA_CLIENT_ID
    ? { clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID }
    : {}),
  ...(process.env.TINA_TOKEN ? { token: process.env.TINA_TOKEN } : {}),

  // Enable local mode for development
  ...(process.env.NODE_ENV === 'development' ? {
    local: {
      enabled: true,
    },
  } : {}),

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/r/content-modelling-collections/
  schema: {
    collections: [
      {
        name: "post",
        label: "Blog Posts",
        path: "content/posts",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            description: "Short summary of the post",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "image",
            name: "featuredImage",
            label: "Featured Image",
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true,
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            options: [
              "Nachhaltigkeit",
              "Linux & Open Source",
              "Hardware-Wiederbelebung",
              "Web Development",
              "AI & Technology"
            ],
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "datetime",
            name: "publishedAt",
            label: "Published Date",
            ui: {
              dateFormat: "YYYY-MM-DD",
            },
          },
          {
            type: "boolean",
            name: "published",
            label: "Published",
            description: "Set to true to make this post visible",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
        defaultItem: () => {
          return {
            title: "New Post",
            author: "RevampIt Team",
            published: false,
            publishedAt: new Date().toISOString(),
          }
        },
        ui: {
          router: () => `/blog/new-post`,
        },
      },
      {
        name: "page",
        label: "Pages",
        path: "content/pages",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "Slug",
            description: "URL path for this page",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            description: "Meta description for SEO",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Content",
            isBody: true,
          },
        ],
        defaultItem: () => {
          return {
            title: "New Page",
            slug: "new-page",
          }
        },
        ui: {
          router: () => `/new-page`,
        },
      },
      {
        name: "service",
        label: "Services",
        path: "content/services",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "Slug",
            description: "URL path for this service",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            description: "Short description of the service",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            description: "Service category",
          },
          {
            type: "string",
            name: "features",
            label: "Features",
            list: true,
            description: "List of service features",
          },
          {
            type: "string",
            name: "pricing",
            label: "Pricing",
            description: "Pricing information",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Content",
            isBody: true,
          },
        ],
        defaultItem: () => {
          return {
            title: "New Service",
            slug: "new-service",
            category: "General Services",
          }
        },
        ui: {
          router: () => `/services/new-service`,
        },
      },
      {
        name: "project",
        label: "Projects",
        path: "content/projects",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "Slug",
            description: "URL path for this project",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            description: "Short description of the project",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "status",
            label: "Status",
            options: [
              "Planning",
              "Active",
              "Completed",
              "On Hold"
            ],
          },
          {
            type: "string",
            name: "technologies",
            label: "Technologies",
            list: true,
            description: "Technologies used in this project",
          },
          {
            type: "string",
            name: "githubUrl",
            label: "GitHub URL",
            description: "Link to GitHub repository",
          },
          {
            type: "string",
            name: "demoUrl",
            label: "Demo URL",
            description: "Link to live demo",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Content",
            isBody: true,
          },
        ],
        defaultItem: () => {
          return {
            title: "New Project",
            slug: "new-project",
            status: "Planning",
          }
        },
        ui: {
          router: () => `/projects/new-project`,
        },
      },
    ],
  },
});
