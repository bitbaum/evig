# RevampIT Documentation

This directory contains comprehensive documentation for the RevampIT platform components, APIs, and architecture.

## Structure

```
docs/
├── README.md                    # This file
├── components/                  # Component documentation
│   ├── SuggestionButton.md     # User feedback system
│   └── RevampCopilot.md        # AI chatbot (if documented)
├── api/                        # API documentation
│   ├── suggestions.md          # Suggestion API endpoints
│   └── admin.md               # Admin API endpoints
├── architecture/               # System architecture docs
│   ├── overview.md            # High-level architecture
│   └── database.md           # Database schema and design
├── deployment/                 # Deployment and DevOps
│   ├── vercel.md              # Vercel deployment guide
│   └── environment.md         # Environment variables
├── guides/                     # User and developer guides
│   ├── development.md          # Development setup
│   ├── contributing.md         # Contribution guidelines
│   └── troubleshooting.md      # Common issues and solutions
├── floating-ui-typing-fix.md   # Critical typing issue fix documentation
└── legacy/                     # Archived documentation
```

## Quick Navigation

### Components
- [**SuggestionButton**](./components/SuggestionButton.md) - Comprehensive user feedback system with multi-scope suggestions and element selection

### APIs
- [**Suggestion API**](./api/suggestions.md) - RESTful endpoints for managing user suggestions (TODO)
- [**Admin API**](./api/admin.md) - Administrative endpoints and authentication (TODO)

### Architecture
- [**System Overview**](./architecture/overview.md) - High-level system design and data flow (TODO)
- [**Database Design**](./architecture/database.md) - Schema and relationships (TODO)

### Deployment
- [**Vercel Deployment**](./deployment/vercel.md) - Production deployment guide (TODO)
- [**Environment Setup**](./deployment/environment.md) - Configuration and secrets (TODO)

### Development
- [**Getting Started**](./guides/development.md) - Local development setup (TODO)
- [**Contributing**](./guides/contributing.md) - Code standards and PR process (TODO)
- [**Troubleshooting**](./guides/troubleshooting.md) - Common issues and solutions (TODO)

### Special Documentation
- [**Floating UI Typing Fix**](./floating-ui-typing-fix.md) - Critical fix for React input pattern conflicts (September 2025)

## Documentation Standards

### Component Documentation
Each component should include:
- **Overview** - Purpose and key features
- **API Reference** - Props, methods, events
- **Usage Examples** - Code snippets and patterns
- **Architecture** - Internal structure and patterns
- **Styling** - CSS classes and theming
- **Accessibility** - ARIA labels and keyboard navigation
- **Best Practices** - Performance and maintainability tips
- **Troubleshooting** - Common issues and solutions

### API Documentation
Each API endpoint should document:
- **Endpoint details** - URL, method, authentication
- **Request/Response schemas** - TypeScript interfaces
- **Error handling** - Status codes and error messages
- **Rate limiting** - Limits and policies
- **Examples** - cURL and JavaScript examples

### Code Standards
- **TypeScript interfaces** for all data structures
- **JSDoc comments** for public functions and classes
- **Inline comments** for complex business logic
- **README files** in each major directory
- **Architecture decision records** (ADRs) for significant decisions

## Contributing to Documentation

1. **Keep it current** - Update docs when changing functionality
2. **Be comprehensive** - Include examples and edge cases
3. **Use clear language** - Write for different skill levels
4. **Add diagrams** - Visual aids for complex concepts
5. **Test examples** - Ensure all code snippets work
6. **Link related content** - Cross-reference related documentation

## Tools and Conventions

### Markdown
- Use **GitHub Flavored Markdown** for consistency
- Include **table of contents** for long documents
- Use **code blocks** with language specification
- Add **badges** for status indicators

### Diagrams
- **Mermaid** for flowcharts and architecture diagrams
- **ASCII art** for simple text diagrams
- **Screenshots** for UI components and workflows

### Code Examples
- **TypeScript** for type safety and clarity
- **Complete examples** that can be copy-pasted
- **Error handling** in production examples
- **Environment considerations** (dev vs prod)

---

*This documentation is maintained by the RevampIT development team. For questions or suggestions, please create an issue or contact the maintainers.*