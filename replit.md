# Business Registration System

## Overview
This project is a comprehensive full-stack business registration application. It streamlines the registration process for clients by handling form submissions, document uploads, automated file organization in Google Drive, email confirmations, WhatsApp notifications, and PDF generation. An integrated admin dashboard allows for efficient management of all submissions. The system aims to provide a complete workflow solution for business registration, enhancing efficiency and organization for accounting professionals.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Focus: Professional business registration system with complete automation and document management.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript.
- **UI/UX**: Shadcn/ui component library based on Radix UI, styled with Tailwind CSS for dark/light theme.
- **State Management**: TanStack React Query.
- **Form Handling**: React Hook Form with Zod validation.

### Backend
- **Framework**: Express.js with TypeScript on Node.js 20.
- **Database**: PostgreSQL 16 with Drizzle ORM.
- **File Handling**: Multer for uploads, Puppeteer for PDF generation.
- **Email Service**: Nodemailer.
- **Cloud Storage**: Google Drive API integration.

### Core Features
- **Multiple Partners Support**: Ability to add unlimited business partners with individual document uploads and data collection.
- **Document Management**: Automatic Google Drive folder creation per business, with validated file uploads and specific naming conventions.
- **Automated Workflows**: Includes email confirmations, PDF generation, WhatsApp notifications via n8n, and Google Drive organization.
- **Admin Dashboard**: Centralized view for managing submissions, filtering by status, searching, and downloading PDFs.
- **Database Schema**: Utilizes a `business_registrations` table to store company, partner, and file data, alongside status tracking.
- **API Endpoints**: Standard RESTful API for submission, retrieval, and PDF generation of registrations.
- **Frontend Pages**: Dedicated pages for client registration form, admin dashboard, team access, and internal Kanban system.
- **Data Flow**: Comprehensive flow from client submission and validation through backend processing, database storage, cloud uploads, and notifications.
- **UI/UX Decisions**: Default dark mode with toggle, modern component design using Shadcn/ui and Tailwind CSS.
- **Technical Implementations**: Utilizes JWT for secure authentication, bcrypt for password hashing, and supports multi-partner data processing.
- **System Design Choices**: Modular API provider system, flexible status management for clients and registrations, and robust error handling.

## External Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL.
- **ORM**: drizzle-orm and drizzle-zod.
- **UI**: Radix UI components, date-fns.
- **Forms**: @hookform/resolvers (with Zod).
- **File Handling**: react-dropzone (frontend), Multer (backend).
- **PDF Generation**: Puppeteer.
- **Email Service**: Nodemailer.
- **Cloud Storage**: googleapis (for Google Drive).
- **Messaging/Automation**: n8n (for WhatsApp notifications).