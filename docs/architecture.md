# DevMeter Architecture

This document outlines the architecture and technology stack for DevMeter, a developer scoring platform.

## System Architecture

DevMeter follows a microservices architecture with the following components:

```
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│  Web Frontend   │◄────────────►│   API Service   │◄────────────►│  Database (PG)  │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

## Technology Stack

### Infrastructure
- **Hosting**: Vercel
- **Database**: MongoDB

### Backend
- **API Framework**: Next.js
- **Authentication**: JWT tokens + Github OAuth

### Frontend
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS


## Data Flow

1. **User Registration & Authentication**
   - Users logs in via Github
   - JWT tokens manage session state

2. **Github Analysis**
   - Fetches Github activity
   - Calculates several metrics such as commit frequency, number of repositories, number of stars, etc.
   - Generates a score based on these metrics

3. **Score Storage**
   - Stores the calculated metrics and score in the database

4. **Score Display and Sharing**
   - Displays the score and metrics on the frontend
   - Allows users to share their score on social media

## Database Schema (High-Level)

- **Users**: User accounts and authentication
- **Metrics**: Github metrics and scores

## Security Considerations

- All API endpoints secured with JWT authentication
- HTTPS encryption for all communications
- Secure storage of credentials in environment variables
- Regular security audits and dependency updates
- GDPR and data privacy compliance for user information

