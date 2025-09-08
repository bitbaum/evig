# Contributing to RevampIT

We're thrilled that you're interested in contributing to RevampIT! This document provides guidelines and information for contributors to help make the process smooth and effective.

## 🌟 Ways to Contribute

### Code Contributions
- 🐛 **Bug Fixes** - Fix issues and improve stability
- ✨ **New Features** - Implement new functionality
- 🔧 **Refactoring** - Improve code quality and performance
- 📝 **Documentation** - Improve existing docs or create new ones
- 🧪 **Testing** - Add or improve tests

### Non-Code Contributions
- 🎨 **Design** - UI/UX improvements and design assets
- 🌐 **Translation** - Help with German/English localization
- 📖 **Documentation** - User guides, tutorials, and API docs
- 🐛 **Bug Reports** - Report issues and suggest improvements
- 💡 **Feature Requests** - Suggest new features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Git knowledge
- Basic understanding of Next.js and TypeScript

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/revampit.git
   cd revampit
   ```

2. **Install Dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # CMS API dependencies  
   cd cms-api
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   cp cms-api/.env.example cms-api/.env
   # Edit environment files with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start PostgreSQL using Docker
   docker-compose up -d postgres
   
   # Run migrations
   cd cms-api
   npm run migrate
   cd ..
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Start CMS API
   cd cms-api && npm run dev
   
   # Terminal 2: Start Frontend  
   npm run dev
   ```

## 🛠️ Development Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes  
- `docs/documentation-update` - Documentation updates
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions/improvements

### Commit Messages
Follow conventional commits format:

```
type(scope): description

Examples:
feat(cms): add rich text editor for page content
fix(auth): resolve JWT token expiration issue  
docs(readme): update installation instructions
style(ui): improve button component styling
test(api): add unit tests for user authentication
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add/update tests as needed
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run test          # Run tests
   npm run lint          # Check linting
   npm run type-check    # TypeScript check
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   git push origin feature/amazing-feature
   ```

5. **Open Pull Request**
   - Use descriptive title and description
   - Reference related issues
   - Add screenshots for UI changes
   - Request review from maintainers

## 📋 Code Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### React/Next.js
- Use functional components with hooks
- Implement proper error boundaries
- Follow Next.js best practices for routing and data fetching
- Use server components where appropriate

### Styling
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Ensure accessibility standards (WCAG 2.1)

### Testing
- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include E2E tests for critical user flows
- Maintain minimum 80% code coverage

## 🎉 Recognition

Contributors are recognized in several ways:

- **README contributors section** - All contributors listed
- **Release notes** - Major contributors mentioned
- **Community highlights** - Featured in newsletters
- **Maintainer opportunities** - Active contributors can become maintainers

## 🙏 Thank You

Thank you for contributing to RevampIT! Your contributions help us achieve our mission of sustainable technology and digital inclusion.

---

**Happy Contributing! 🚀**

