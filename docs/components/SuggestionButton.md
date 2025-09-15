# SuggestionButton Component

## Overview

The `SuggestionButton` is a comprehensive user feedback component that allows visitors to suggest improvements for the RevampIT website. It provides a floating button that expands into a sophisticated feedback panel with multiple feedback scopes and element selection capabilities.

## Features

### 🎯 Multi-Scope Feedback
- **Website-wide feedback** (🌐) - Global improvements and navigation suggestions
- **Page-specific feedback** (📄) - Improvements for the current page
- **Element-specific feedback** (🎯) - Targeted feedback for selected UI elements

### ✨ Smart Element Selection
- Visual element picker with hover highlighting
- Multiple element selection support
- Real-time selection counter and visual markers
- Detailed element metadata capture (type, text, selector)

### 🚀 User Experience
- Contextual quick suggestions based on feedback scope
- Auto-focus and keyboard shortcuts (ESC to close, Ctrl+Enter to submit)
- Real-time character counter with visual feedback
- Rate limiting and spam protection
- Success animations and feedback

### 📧 Advanced Email Notifications
- Rich HTML email templates with scope-specific styling
- AI-developer ready prompts for immediate implementation
- Complete context information (page, URL, timestamp, IP)
- Element details with selectors for technical implementation

## Architecture

### Component Structure
```
SuggestionButton/
├── Main Component (SuggestionButton.tsx)
├── Sub-components:
│   ├── FeedbackScopeSelector
│   ├── ContextualQuickSuggestions
│   ├── SuggestionForm
│   └── SuccessMessage
├── Utilities:
│   ├── Element Selection Logic
│   ├── Focus Management
│   └── State Management
└── Documentation (this file)
```

### State Management
- **Local State**: Form data, UI state, selected elements
- **Context Integration**: Current page information via `useSuggestionContext`
- **Optimized Re-renders**: Memoized handlers and callbacks to prevent input issues

### Performance Optimizations
- `useCallback` for all event handlers to prevent re-renders
- Memoized sub-components to reduce unnecessary updates
- Efficient DOM manipulation for element selection
- Smart focus management with cleanup

## Usage

### Basic Implementation
```tsx
import SuggestionButton from '@/components/ui/SuggestionButton'
import { SuggestionContextProvider } from '@/contexts/SuggestionContext'

function Layout() {
  return (
    <SuggestionContextProvider>
      <main>
        {/* Your page content */}
      </main>
      <SuggestionButton />
    </SuggestionContextProvider>
  )
}
```

### Context Setup
The component requires the `SuggestionContext` to provide current page information:
```tsx
// In your context provider
const contextValue = {
  currentPage: {
    path: '/',
    title: 'Home',
    section: 'landing'
  },
  isVisible: true
}
```

## API Integration

### Endpoint: `/api/suggestions`
```typescript
POST /api/suggestions
Content-Type: application/json

{
  suggestion: string,           // Required: 5-1000 characters
  contact?: string,            // Optional: User contact info
  page: string,               // Current page path
  url: string,                // Full URL
  pageTitle?: string,         // Page title
  pageSection?: string,       // Page section
  feedbackScope: 'site' | 'page' | 'element',
  selectedElements?: Array<{
    elementType: string,      // HTML tag name
    elementText: string,      // Element text content (truncated)
    selector: string         // CSS selector for targeting
  }>,
  timestamp: string          // ISO string
}
```

### Rate Limiting
- **3 suggestions per 5 minutes per IP**
- **Automatic cleanup** of old rate limit entries
- **Graceful error handling** with user-friendly messages

### Spam Protection
- Content filtering for common spam patterns
- Length validation (5-1000 characters)
- Basic sanitization of user inputs

## Email Integration

### SMTP Configuration
```env
# Development (uses Ethereal for testing)
NODE_ENV=development

# Production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@revamp-it.ch
```

### Email Features
- **Rich HTML Templates**: Responsive design with scope-specific colors
- **AI-Ready Prompts**: Copy-paste ready instructions for AI developers
- **Complete Context**: All necessary information for implementation
- **Fallback Text**: Plain text version for accessibility

## Styling & Theming

### CSS Classes
```css
.suggestion-selected-element {
  /* Applied to selected elements during selection mode */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
  border: 2px solid #3b82f6 !important;
}

.suggestion-selected-element::after {
  /* Checkmark indicator for selected elements */
  content: '✓';
  /* ... positioning and styling */
}
```

### Scope-Specific Colors
- **Website scope**: Purple (`#7c3aed`)
- **Page scope**: Green (`#16a34a`)
- **Element scope**: Blue (`#2563eb`)

## Accessibility

### ARIA Labels
- `aria-label`: Descriptive labels for all interactive elements
- `aria-expanded`: Button state indication
- `role="dialog"`: Proper dialog semantics
- `aria-modal="true"`: Modal dialog behavior

### Keyboard Navigation
- **ESC**: Close panel and reset state
- **Ctrl+Enter**: Submit suggestion (when valid)
- **Tab navigation**: Proper focus management
- **Auto-focus**: Smart focus on panel open

### Focus Management
- Automatic focus on textarea when panel opens
- Focus trap within the panel during interaction
- Proper focus restoration on panel close
- Skip focus during element selection mode

## Error Handling

### Client-Side Validation
```typescript
// Validation rules
- Minimum length: 5 characters
- Maximum length: 500 characters (UI), 1000 (API)
- Required fields: suggestion text
- Element selection: Required when scope is 'element'
```

### Server-Side Protection
- Rate limiting with clear error messages
- Spam detection with content filtering
- Input sanitization and length validation
- Graceful email failure handling (doesn't fail the request)

### User Feedback
```typescript
// Error states
- Network errors: "Netzwerkfehler. Bitte versuchen Sie es später erneut."
- Rate limiting: "Too many requests. Please wait a few minutes."
- Validation: Field-specific error messages
- Success: Animated success message with auto-close
```

## Best Practices

### Performance
1. **Memoize all event handlers** with `useCallback`
2. **Optimize re-renders** by avoiding inline functions
3. **Clean up event listeners** in useEffect cleanup
4. **Debounce expensive operations** like DOM queries

### Accessibility
1. **Provide clear labels** for all interactive elements
2. **Maintain focus management** throughout the interaction
3. **Use semantic HTML** and proper ARIA attributes
4. **Test with screen readers** and keyboard navigation

### User Experience
1. **Provide immediate feedback** for all user actions
2. **Use contextual suggestions** based on current scope
3. **Clear visual hierarchy** with consistent color schemes
4. **Mobile-responsive design** with touch-friendly targets

### Code Organization
1. **Split complex components** into focused sub-components
2. **Group related functionality** with custom hooks
3. **Document all props and interfaces** with TypeScript
4. **Follow consistent naming conventions** throughout

## Troubleshooting

### Common Issues

**Input only accepts one character at a time:**
- ✅ Fixed with memoized `onChange` handlers
- Ensure no unnecessary re-renders in parent components
- Check that `value` and `onChange` are properly bound

**Element selection not working:**
- Check z-index stacking with other UI elements
- Ensure event listeners are properly attached/detached
- Verify panel ref is excluding clicks correctly

**Emails not sending:**
- Check SMTP configuration in environment variables
- Verify network connectivity and firewall settings
- Check console logs for detailed error messages
- Test with Ethereal email in development mode

**Rate limiting too aggressive:**
- Adjust `MAX_REQUESTS` and `RATE_LIMIT_WINDOW` constants
- Consider per-user identification beyond IP addresses
- Implement exponential backoff for repeat requests

## Development

### Testing in Development
```bash
# Start development server
npm run dev

# Check email preview (Ethereal)
# URLs will be logged to console when emails are sent
```

### Environment Variables
```env
# Required for production
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM=sender@your-domain.com

# Optional
NODE_ENV=development|production
```

### Contributing
1. Follow the existing code style and component patterns
2. Add JSDoc comments for all public functions and interfaces
3. Test accessibility with keyboard navigation and screen readers
4. Ensure mobile responsiveness across different screen sizes
5. Update this documentation when adding new features

## Future Enhancements

### Potential Improvements
- [ ] **Drag and drop element selection** for better UX
- [ ] **Screenshot capture** of selected elements
- [ ] **Integration with issue tracking systems** (GitHub, Jira)
- [ ] **User authentication** for personalized suggestions
- [ ] **Suggestion voting and prioritization** system
- [ ] **Real-time collaborative suggestions** with WebSockets
- [ ] **Advanced analytics** for suggestion patterns
- [ ] **A/B testing** for different suggestion prompts

### Technical Debt
- [ ] Extract element selection logic into custom hook
- [ ] Improve TypeScript types for better type safety
- [ ] Add unit tests for complex state management
- [ ] Implement proper logging system instead of console.log
- [ ] Add Storybook stories for component documentation