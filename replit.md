# Business Registration System

## Overview

This is a full-stack business registration application built with React frontend and Express.js backend. The system allows users to submit business registration forms with document uploads and provides a comprehensive interface for managing business registration data.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Custom FileUpload component with dropzone functionality

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL 16 (configured but ready for connection)
- **File Handling**: Multer for multipart form data
- **Build Tool**: ESBuild for production builds
- **Development**: TSX for TypeScript execution

### Build System
- **Frontend Bundler**: Vite with React plugin
- **Backend Bundler**: ESBuild for production builds
- **Development Server**: Vite dev server proxied through Express
- **TypeScript**: Configured for both client and server with path aliases

## Key Components

### Database Schema
The system uses a single `business_registrations` table with comprehensive fields:
- **Company Data**: Business name, address, activities, contact information
- **Partner Data**: Personal information, documents, contact details
- **File Management**: URLs for uploaded documents (Google Drive integration ready)
- **Metadata**: Creation timestamps and status tracking

### API Endpoints
- `POST /api/business-registration` - Submit business registration with file uploads
- File upload handling with validation for JPEG, PNG, and PDF formats
- 10MB file size limit with proper error handling

### Frontend Pages
- **Business Registration Form**: Multi-step form with file upload capabilities
- **404 Page**: Custom not found page with helpful messaging

### File Upload System
- Drag and drop interface for document uploads
- Support for multiple file types (images and PDFs)
- File validation and size restrictions
- Google Drive integration architecture (ready for implementation)

## Data Flow

1. **Form Submission**: User fills out business registration form with document uploads
2. **Client Validation**: Zod schema validation on the frontend
3. **File Processing**: Multer processes multipart form data on the backend
4. **Data Storage**: Business registration data stored in PostgreSQL via Drizzle ORM
5. **File Storage**: Document URLs stored (Google Drive integration architecture in place)

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-zod for database operations
- **UI**: Comprehensive Radix UI component suite
- **Forms**: @hookform/resolvers with Zod validation
- **File Handling**: react-dropzone for file uploads

### Development Tools
- **Build**: Vite for frontend, ESBuild for backend
- **Runtime**: TSX for TypeScript development
- **Styling**: Tailwind CSS with PostCSS

## Deployment Strategy

### Development Environment
- Replit-hosted with PostgreSQL module
- Hot reload enabled for both frontend and backend
- Port 5000 configured for local development

### Production Build
- Frontend: Vite build to `dist/public`
- Backend: ESBuild bundle to `dist/index.js`
- Deployment target: Autoscale with proper build commands
- Environment variables: DATABASE_URL required for PostgreSQL connection

### File Storage Strategy
- Google Drive API integration architecture prepared
- Environment variables configured for API keys
- Fallback to simulated uploads in development

## Changelog

- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.