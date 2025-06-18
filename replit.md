# Business Registration System

## Overview

This is a comprehensive full-stack business registration application built with React frontend and Express.js backend. The system provides a complete workflow for clients to submit business registration forms with document uploads, automatic file organization in Google Drive, email confirmations, WhatsApp notifications, PDF generation, and an admin dashboard for managing submissions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for dark/light theme support
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Custom FileUpload component with dropzone functionality
- **Theme System**: Dark mode default with light mode toggle

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16 with Drizzle ORM
- **File Handling**: Multer for multipart form data processing
- **PDF Generation**: Puppeteer for automated PDF creation
- **Email Service**: Nodemailer for automated email confirmations
- **Cloud Storage**: Google Drive API for document organization
- **Build Tool**: ESBuild for production builds

### Build System
- **Frontend Bundler**: Vite with React plugin
- **Backend Bundler**: ESBuild for production builds
- **Development Server**: Vite dev server proxied through Express
- **TypeScript**: Configured for both client and server with path aliases

## Key Features

### Multiple Partners Support
- Add unlimited business partners to registration
- Individual document uploads for each partner
- Complete partner data collection (personal info, documents, contact details)
- Edit/delete partners before submission

### Document Management
- Automatic Google Drive folder creation named by business (e.g., "Razão Social - ID")
- Individual file uploads per partner with proper naming conventions
- Support for JPEG, PNG, and PDF formats (10MB limit)
- Document validation and progress tracking

### Automated Workflows
- **Email Confirmations**: Automatic emails sent to both client and contato@prosperarcontabilidade.com.br
- **PDF Generation**: Professional PDF with all business and partner data
- **WhatsApp Notifications**: Integration with n8n webhook for instant notifications
- **Google Drive Organization**: All files and generated PDF uploaded to dedicated folder

### Admin Dashboard
- View all business registration submissions
- Filter by status (pending, processing, completed)
- Search by business name
- Detailed view of each submission
- PDF download functionality
- Real-time statistics

### Database Schema
The system uses a `business_registrations` table with:
- **Company Data**: Business details, activities, contact information
- **Partners Data**: JSON array of partner objects with complete information
- **File Management**: Document URLs linked to Google Drive
- **Status Tracking**: Workflow status and timestamps

### API Endpoints
- `POST /api/business-registration` - Submit registration with file uploads
- `GET /api/business-registrations` - List all registrations (dashboard)
- `GET /api/business-registration/:id` - Get specific registration
- `GET /api/business-registration/:id/pdf` - Generate and download PDF

### Frontend Pages
- **Business Registration Form**: Multi-partner form with file uploads and theme toggle
- **Dashboard**: Admin interface for viewing and managing submissions
- **404 Page**: Custom not found page

## Data Flow

1. **Form Submission**: User completes business and partner information with document uploads
2. **Client Validation**: Comprehensive Zod schema validation
3. **Backend Processing**: Multi-partner data processing and file handling
4. **Database Storage**: Registration data stored in PostgreSQL
5. **Google Drive Upload**: Automatic folder creation and file organization
6. **PDF Generation**: Professional business summary PDF created and uploaded
7. **Email Notifications**: Confirmation emails sent to client and accounting office
8. **WhatsApp Integration**: n8n webhook triggered for instant messaging
9. **Dashboard Updates**: Real-time dashboard reflects new submissions

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-zod for database operations
- **UI**: Comprehensive Radix UI component suite with date-fns
- **Forms**: @hookform/resolvers with Zod validation
- **File Handling**: react-dropzone for file uploads, multer for backend
- **PDF Generation**: puppeteer for document creation
- **Email Service**: nodemailer for automated emails
- **Cloud Storage**: googleapis for Google Drive integration

### Development Tools
- **Build**: Vite for frontend, ESBuild for backend
- **Runtime**: TSX for TypeScript development
- **Styling**: Tailwind CSS with PostCSS and theme support

## Environment Variables Required

### Email Configuration
- `EMAIL_USER`: Gmail account for sending emails
- `EMAIL_PASSWORD`: Gmail app password

### Google Drive Integration
- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON service account key for Google Drive API

### n8n Integration
- `N8N_WEBHOOK_URL`: Webhook URL for WhatsApp notifications

### Database
- `DATABASE_URL`: PostgreSQL connection string (auto-configured in Replit)

## Deployment Strategy

### Development Environment
- Replit-hosted with PostgreSQL database
- Hot reload enabled for both frontend and backend
- Port 5000 configured for local development
- Dark theme as default with toggle functionality

### Production Build
- Frontend: Vite build to `dist/public`
- Backend: ESBuild bundle to `dist/index.js`
- Database migrations via Drizzle push
- Environment variables required for full functionality

### File Storage Strategy
- Google Drive API integration with service account authentication
- Automatic folder creation per business registration
- Professional PDF generation and upload
- Organized file naming conventions

## Recent Changes

### December 18, 2025 - Major Feature Update
- **Multiple Partners Support**: Added ability to manage unlimited business partners
- **Dark Theme Implementation**: Dark mode as default with light mode toggle
- **Database Migration**: Moved from memory storage to PostgreSQL with Drizzle ORM
- **Google Drive Integration**: Automatic folder creation and file organization
- **Email Automation**: Confirmation emails for client and accounting office
- **PDF Generation**: Professional business registration PDF with all data
- **Admin Dashboard**: Complete management interface with search and filtering
- **WhatsApp Integration**: n8n webhook integration for instant notifications
- **Enhanced UI**: Improved contrast and accessibility in dark mode
- **Document Organization**: Smart file naming and Google Drive folder structure

## User Preferences

Preferred communication style: Simple, everyday language.
Project Focus: Professional business registration system with complete automation and document management.