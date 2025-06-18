## Setup Instructions

### Prerequisites
- Node.js 18.17.0 (use `nvm use` if you have nvm)
- npm 8.0.0+

### Installation
```bash
# Clone the repository
git clone <your-repo>
cd your-project

# Install dependencies (will auto-check versions)
npm run setup

# If you get React version conflicts:
npm run fix-deps

# Start development
npm run dev

# Team Setup Guide

## First Time Setup
1. Ensure Node.js 18.17.0: `nvm use` or `node -v`
2. Run: `npm run setup`
3. If React conflicts: `npm run fix-all`
4. Start: `npm run dev`

## Daily Development
- Always run `npm install` after pulling changes
- If weird errors occur, try `npm run fix-all`
- Use `npm run check-versions` to verify consistency

## Common Issues
- **React version conflicts**: Run `npm run fix-all`
- **Cache issues**: Run `npx expo r -c`
- **Port conflicts**: Run `npm run stop` first

