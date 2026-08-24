# TrustAgent

A modern, full-stack application built with Next.js and React for an AWS Hackathon project.

## Overview

TrustAgent is a TypeScript-based web application that combines the power of Next.js for server-side rendering and static generation with React for dynamic user interfaces. The project is designed with a focus on type safety and modern development practices.

## Tech Stack

- **Frontend Framework:** Next.js 14.2
- **UI Library:** React 18.3
- **Language:** TypeScript 5.5
- **Styling:** Tailwind CSS 3.4
- **Package Manager:** npm
- **UUID Generation:** uuid 14.0

## Project Structure

```
aws_hackathon/
├── trustagent/           # Main Next.js application
│   ├── package.json      # Project dependencies
│   ├── tsconfig.json     # TypeScript configuration
│   ├── next.config.js    # Next.js configuration
│   └── [Next.js app structure]
├── docs/                 # Documentation files
├── .kiro/                # Additional configuration
├── .gitignore            # Git ignore rules
└── package-lock.json     # Locked dependencies
```

## Getting Started

### Prerequisites

- Node.js (14.x or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/BennetDyani/aws_hackathon.git
cd aws_hackathon
```

2. Navigate to the TrustAgent directory:
```bash
cd trustagent
```

3. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Linting

Run the linter:
```bash
npm run lint
```

## Features

- ⚡ Fast development experience with Next.js hot reloading
- 🎨 Styled with Tailwind CSS for rapid UI development
- 📝 Full TypeScript support for type safety
- 🚀 Optimized production builds
- 🔧 ESLint integration for code quality

## Development Tools

- **Autoprefixer:** Automatic CSS vendor prefixing
- **PostCSS:** CSS transformation tool
- **TypeScript:** Static type checking
- **React Types:** Type definitions for React and React DOM

## License

This project is part of an AWS Hackathon.

## Author

BennetDyani

---

For more information or contributions, please visit the [repository](https://github.com/BennetDyani/aws_hackathon).
