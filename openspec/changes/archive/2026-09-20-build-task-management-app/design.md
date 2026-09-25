## Context

Building a full-stack web application with React+TypeScript frontend and Java 21+ Spring Boot backend. The system will manage tasks with CRUD operations, user authentication, and REST API integration.

## Goals / Non-Goals

**Goals:**
- Implement secure REST API endpoints for task management
- Build responsive React UI with TypeScript
- Ensure proper authorization and data validation
- Use modern Java Spring Boot features (Spring Security, JPA)

**Non-Goals:**
- Complex role-based access control beyond user ownership
- Real-time updates via WebSockets
- Advanced reporting or analytics

## Decisions

### Backend Technology Stack
- **Java 21 with Spring Boot 3.x**: Modern Java features and Spring's robust ecosystem
- **Spring Data JPA**: For database operations with Hibernate
- **Spring Security**: For authentication and authorization
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **H2 Database**: In-memory database for development, can be switched to PostgreSQL/MySQL for production

### Frontend Technology Stack
- **React 18+**: Component-based UI framework
- **TypeScript**: Type safety and modern JavaScript features
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing
- **Material-UI or TailwindCSS**: For styling components

### Database Schema
- **User Table**: id, email (unique), password (hashed), created_at
- **Task Table**: id, user_id (foreign key), title, description, priority (enum: LOW/MEDIUM/HIGH), due_date (nullable), created_at, updated_at

### API Endpoints
- `POST /v1/auth/register`: User registration
- `POST /v1/auth/login`: User login (returns JWT)
- `GET /v1/tasks`: List all user's tasks
- `GET /v1/tasks/{id}`: Get specific task
- `POST /v1/tasks`: Create new task
- `PUT /v1/tasks/{id}`: Update existing task
- `DELETE /v1/tasks/{id}`: Delete task

### Security Implementation
- Password hashing with BCrypt
- JWT validation with secret key
- Role-based access control (User role only)
- CORS configuration for frontend-backend communication

## Risks / Trade-offs

[Using H2 in-memory database] → Easy development but requires migration to production-grade DB later
[JWT stateless authentication] → Simpler to implement but no built-in token revocation mechanism
