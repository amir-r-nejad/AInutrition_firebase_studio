# Overview

NutriPlan is a NextJS-based nutrition and meal planning application built with AI-powered features. The application provides personalized meal planning, macro tracking, and nutrition guidance through an intuitive web interface. It integrates with Google's Gemini AI and OpenAI to generate customized meal plans and provide intelligent nutrition recommendations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with App Router for server-side rendering and client-side interactivity
- **UI Components**: Custom design system using shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom color scheme (forest green primary, cream backgrounds, orange accents)
- **State Management**: React hooks and server actions for data management
- **TypeScript**: Full TypeScript implementation for type safety

## Backend Architecture
- **Server Actions**: Next.js server actions for API endpoints and server-side logic
- **AI Integration**: Dual AI provider setup with Google Gemini and OpenAI for meal plan generation
- **Schema Validation**: Zod schemas for input/output validation across all AI flows
- **File Structure**: Feature-based organization with dedicated AI flows and data services

## Authentication & Authorization
- **Provider**: Supabase Auth for user authentication and session management
- **Middleware**: Custom middleware for route protection and session updates
- **User Roles**: Support for both client and coach user types with role-based access

## AI & ML Components
- **Genkit Framework**: Google's Genkit for AI model orchestration and prompt management
- **Model Integration**: 
  - Google Gemini 2.0 Flash for meal plan generation and nutrition advice
  - OpenAI GPT-4 for ingredient optimization and meal suggestions
- **Flow Architecture**: Structured AI flows for:
  - Personalized meal plan generation
  - Ingredient swapping and optimization
  - Macro-based meal suggestions
  - Support chatbot functionality

## Data Management
- **Nutrition Calculations**: Custom algorithms for BMR, TDEE, and macro distribution
- **Meal Planning**: AI-driven meal generation with macro validation and ingredient optimization
- **Profile Management**: Comprehensive user profiling including dietary preferences, allergies, and health goals

# External Dependencies

## Database & Backend Services
- **Supabase**: Primary database and authentication provider
- **Supabase SSR**: Server-side rendering support for authenticated routes

## AI & Machine Learning
- **Google Gemini AI**: Primary AI provider for meal planning and nutrition advice
- **OpenAI GPT-4**: Secondary AI provider for ingredient optimization
- **Genkit**: AI orchestration framework for managing AI workflows

## UI & Design
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React PDF**: PDF generation for meal plans and reports

## Development Tools
- **TypeScript**: Type safety across the application
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Component variant management