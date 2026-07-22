# AI-Native CMS Next.js Example

This is a complete example of integrating AI-Native CMS into a Next.js application.

## 🚀 Features

- **Suggestion Widget**: Floating button that allows visitors to suggest changes
- **Admin Dashboard**: Full-featured dashboard to manage suggestions and generate AI instructions
- **Real-time Updates**: Live updates when suggestions are submitted
- **AI Instruction Generation**: Automatic conversion of suggestions to actionable instructions
- **Multi-provider Notifications**: Email, console, and webhook notifications

## 📦 What's Included

```
nextjs-basic/
├── pages/
│   ├── index.tsx          # Main homepage with suggestion widget
│   ├── admin.tsx          # Admin dashboard page
│   └── api/
│       └── suggestions.ts # API endpoint for handling suggestions
├── styles/
│   └── globals.css        # Global styles
├── package.json
├── next.config.js
└── README.md
```

## 🛠️ Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Environment variables**:
Create `.env.local` file:
```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_cms
DB_USER=postgres
DB_PASSWORD=your_password

# Email notifications (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=AI CMS <noreply@yourdomain.com>
EMAIL_TO=admin@yourdomain.com,dev@yourdomain.com

# Slack notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Discord notifications (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

3. **Set up database** (if using PostgreSQL):
```sql
CREATE DATABASE ai_cms;
-- Tables will be created automatically by the CMS
```

4. **Run the development server**:
```bash
npm run dev
```

5. **Open your browser**:
   - Main site: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## 🎯 How It Works

### 1. User Submits Suggestion
- Visitor clicks the floating suggestion button
- Fills out a form describing what they want changed
- Suggestion is submitted and stored in the database

### 2. AI Processes Suggestion
- AI-Native CMS analyzes the suggestion
- Generates specific, actionable instructions
- Instructions are tailored to your framework (Next.js in this case)

### 3. Developer Gets Notified
- Email/Slack/Discord notifications sent
- Admin can review suggestions in the dashboard
- AI instructions can be copied and pasted into AI agents

### 4. Implementation
- Developer uses AI instructions with Claude Code, Cursor, or other AI tools
- Changes are implemented quickly and accurately
- Suggestion status can be updated to track progress

## 💡 Example AI Instructions

When a user suggests "Make the header bigger", the AI generates:

```markdown
# AI Agent Instructions: Visual/Styling Changes

## 🎨 Visual Modification Request
**Page:** /
**User Request:** "Make the header bigger"

## 🔧 Styling Implementation Steps

1. **Identify Target Elements**
   - Locate the header section in pages/index.tsx
   - Current header uses: `py-6` (1.5rem top/bottom padding)
   - Check for responsive design considerations

2. **Implement Visual Changes**
   - Increase header padding from `py-6` to `py-8` or `py-12`
   - Consider increasing font sizes in the header
   - Ensure mobile responsiveness is maintained

3. **Next.js Specific Notes**
   - File to modify: `pages/index.tsx`
   - Look for the `<header>` element with Tailwind classes
   - Test on different screen sizes after changes

4. **Testing Checklist**
   - [ ] Desktop view (1920x1080)
   - [ ] Tablet view (768px width)  
   - [ ] Mobile view (375px width)
   - [ ] Navigation functionality maintained

This styling request was processed by AI-Native CMS for My Next.js Website.
```

## 🔧 Customization

### Modify AI Templates

Edit the CMS configuration in `pages/index.tsx`:

```typescript
cmsConfig.aiInstructions = {
  provider: 'template',
  config: {
    customPrompts: {
      siteName: 'Your Website Name',
      additionalContext: 'We use Tailwind CSS and custom components'
    }
  }
}
```

### Add Custom Storage

```typescript
import { CustomStorageAdapter } from './lib/CustomStorageAdapter'

cmsConfig.storage = {
  adapter: 'custom',
  config: {
    customAdapter: new CustomStorageAdapter()
  }
}
```

### Configure Notifications

```typescript
cmsConfig.notifications = {
  providers: [
    {
      name: 'email',
      config: {
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
        from: 'noreply@yourdomain.com',
        to: ['admin@yourdomain.com']
      },
      enabled: true
    },
    {
      name: 'slack',
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: '#dev-notifications'
      },
      enabled: !!process.env.SLACK_WEBHOOK_URL
    }
  ]
}
```

## 🎨 Styling

The example uses Tailwind CSS for styling. The suggestion widget comes with built-in styles that can be customized:

```css
/* In your CSS file */
:root {
  --ai-cms-primary-color: #your-brand-color;
  --ai-cms-primary-hover: #your-brand-hover-color;
}
```

Or pass custom styles as props:

```tsx
<SuggestionWidget
  buttonStyle={{
    backgroundColor: '#your-color',
    borderRadius: '12px'
  }}
  modalStyle={{
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }}
/>
```

## 📊 Admin Dashboard Features

- **Statistics Overview**: Total suggestions, status breakdown
- **Filtering & Search**: Filter by status, page, date range
- **AI Generation**: Generate instructions for any suggestion
- **Status Management**: Update suggestion status
- **Copy Instructions**: One-click copy for AI agents
- **Real-time Updates**: Live updates as new suggestions come in

## 🚀 Deployment

### Self-hosted Node server (Recommended)

1. Push code to GitHub
2. On your server (or via CI), pull and `npm ci && npm run build`
3. Set environment variables in the server's `.env`
4. Serve the standalone build behind a reverse proxy (e.g. Caddy/nginx)

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🔍 Troubleshooting

### Common Issues

1. **Database connection fails**:
   - Check environment variables
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Suggestions not saving**:
   - Check browser console for errors
   - Verify API endpoint is working
   - Check database permissions

3. **AI instructions not generating**:
   - Check template configuration
   - Verify suggestion has content
   - Look at server logs for errors

4. **Notifications not working**:
   - Check email/Slack credentials
   - Verify provider configuration
   - Test with console provider first

### Debug Mode

Enable verbose logging:

```typescript
cmsConfig.notifications.providers.push({
  name: 'console',
  config: { verbose: true },
  enabled: true
})
```

## 📚 Learn More

- [AI-Native CMS Core Documentation](../../packages/ai-native-cms-core/README.md)
- [React Components Documentation](../../packages/ai-native-cms-react/README.md)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Found a bug or want to improve this example? Please open an issue or submit a pull request!

## 📄 License

MIT © AI-Native CMS Team