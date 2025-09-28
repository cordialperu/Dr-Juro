# Dr. Juro - Legal Platform

## Overview

Dr. Juro is a comprehensive case and precedent assistant designed for law firms and attorneys in Peru. The platform provides case management functionality with advanced search and automatic comparison against Peruvian jurisprudence from various courts including the Supreme Court, Superior Courts, Constitutional Tribunal, and National Criminal Chamber. The system offers AI-powered document analysis, legal article mapping, and automated explanations with confidence scoring and source citations, all while ensuring compliance with Peru's Personal Data Protection Law (Law N° 29733).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The application uses a **modern single-page application (SPA)** architecture built with React and TypeScript. The UI framework leverages shadcn/ui components with Radix UI primitives for accessibility, styled with Tailwind CSS using a custom design system inspired by enterprise productivity tools like Linear and Notion. The design implements a professional legal interface with both dark and light themes, specialized for legal professionals with sidebar navigation, topbar controls, and a main content area.

**Key frontend decisions:**
- React with TypeScript for type safety and developer experience
- TanStack Query for state management and API communication
- Wouter for lightweight client-side routing
- shadcn/ui component system for consistent, accessible UI components
- Custom CSS variables system for theme management (dark mode primary)

### Backend Architecture

The backend follows a **Node.js Express microservices approach** with:
- **REST API** endpoints for standard CRUD operations
- **GraphQL integration** planned for complex search queries
- **File upload handling** with Multer for document processing (10MB limit, supports PDF, DOC, DOCX, TXT)
- **In-memory storage** currently implemented with plans for database migration
- **OpenAI integration** for AI-powered legal analysis and document processing

**Key backend decisions:**
- Express.js with TypeScript for consistent language across stack
- Modular route organization for scalability
- Comprehensive error handling middleware
- CORS and security considerations for legal data protection

### Data Storage Solutions

The application is designed with **PostgreSQL as the primary database** using Drizzle ORM for type-safe database operations:
- **Connection pooling** via Neon Database serverless PostgreSQL
- **Schema-driven development** with Drizzle for migrations and type safety
- **User management** system with UUID primary keys
- **Blob storage** planned for document attachments and legal files

**Database design rationale:**
- PostgreSQL chosen for ACID compliance required for legal data
- Drizzle ORM provides type safety while maintaining SQL control
- UUID identifiers for security and distributed system compatibility

### Authentication and Authorization

Currently implements a **basic user management system** with:
- Username/password authentication
- In-memory session management (temporary implementation)
- User creation and retrieval functionality
- Planned integration with legal-grade security standards

**Security considerations:**
- Designed for compliance with Peru's Personal Data Protection Law
- Session-based authentication with plans for JWT implementation
- Role-based access control architecture prepared

### AI and Legal Analysis Components

**AI-powered features include:**
- **Document analysis** with confidence scoring and legal concept extraction
- **Precedent matching** against Peruvian jurisprudence database
- **Legal article identification** from Civil and Criminal codes
- **Automated summaries** and citable excerpt generation
- **Risk assessment** and recommendation generation

**AI architecture decisions:**
- OpenAI API integration for natural language processing
- Semantic embeddings for case similarity matching
- Structured legal data extraction with confidence metrics
- Explainable AI outputs for legal transparency requirements

### Legal Data Integration

The platform integrates with **official Peruvian legal sources:**
- Jurisprudence from jurisprudencia.pj.gob.pe
- Legal codes from spijlibre.minjus.gob.pe
- Congressional laws from leyes.congreso.gob.pe

**Integration approach:**
- RESTful API design for external legal database queries
- Cached legal precedent database with structured metadata
- Binding level classification (vinculante, relevante, etc.)
- Article and doctrine cross-referencing system

## External Dependencies

### Core Framework Dependencies

- **React 18** with TypeScript for frontend framework
- **Express.js** with TypeScript for backend API server
- **Vite** for frontend build tooling and development server
- **Tailwind CSS** for styling with custom design system

### UI and Component Libraries

- **Radix UI** primitives for accessible, unstyled UI components
- **shadcn/ui** for pre-built component library with consistent design
- **Lucide React** for consistent iconography
- **class-variance-authority** for component variant management

### State Management and Data Fetching

- **TanStack React Query** for server state management and caching
- **React Hook Form** with Zod resolvers for form validation
- **date-fns** for date manipulation and formatting

### Database and ORM

- **Drizzle ORM** for type-safe database operations
- **Neon Database** (@neondatabase/serverless) for PostgreSQL hosting
- **connect-pg-simple** for PostgreSQL session storage

### AI and External Services

- **OpenAI API** for legal document analysis and AI features
- **Multer** for handling file uploads (documents, PDFs)

### Development and Build Tools

- **TypeScript** for type safety across the entire stack
- **ESBuild** for server-side bundling
- **PostCSS** with Autoprefixer for CSS processing
- **Replit plugins** for development environment integration

### Legal Data Sources

- **jurisprudencia.pj.gob.pe** - Peruvian court jurisprudence database
- **spijlibre.minjus.gob.pe** - Civil and Criminal code articles
- **leyes.congreso.gob.pe** - Congressional laws and regulations

The platform is architected for scalability with plans for microservices expansion, enhanced security features, and integration with additional legal databases as the system grows.