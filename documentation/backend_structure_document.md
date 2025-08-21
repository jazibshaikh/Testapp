# Backend Structure Document

## 1. Backend Architecture

Our backend is a simple, monolithic server built with Node.js and Express, all written in TypeScript. The goal is to give developers a clear, easy-to-extend foundation.

- **Design patterns and frameworks**
  - Express routes and middleware for clear separation of concerns
  - Health-check endpoint to verify the server is running
  - TypeScript interfaces and types to catch errors early

- **Scalability**
  - Containerized with Docker so you can spin up multiple instances behind a load balancer
  - Modular folder structure (`src/server`, `config`, `tests`) makes it easy to add new features without clutter

- **Maintainability**
  - Consistent code style enforced by ESLint and Prettier
  - Husky pre-commit hooks run linting before every commit
  - Clear folder layout so any new team member can find the code they need

- **Performance**
  - Lightweight Express server minimizes overhead
  - Hot-reloading in development speeds up feedback loops
  - Small number of dependencies to reduce startup time

## 2. Database Management

At version 1.0, Testapp does not include a database. We rely solely on the health-check endpoint for our API. In later phases, you might:

- Choose a SQL database like PostgreSQL or MySQL for structured data
- Or pick a NoSQL database like MongoDB if your data is more document-oriented
- Use an ORM (Prisma or TypeORM) for type-safe data access

When you add a database, follow these best practices:

- Store credentials in environment variables (`.env.local`)
- Use migrations to evolve your schema in a controlled way
- Keep your data access layer separate from your route handlers

## 3. Database Schema

Since there’s no database in this initial version, a formal schema isn’t yet defined. Below is an example SQL schema you might adopt when you add a relational database:

-- Example for a User table in PostgreSQL:

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  body TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

## 4. API Design and Endpoints

We follow a RESTful approach with Express. All endpoints live under `/api` and return JSON.

- **GET /api/health**
  - Purpose: Verify the backend is running
  - Response: `{ "status": "ok" }`

- **Proxy setup in development**
  - Next.js dev server on port 3000 forwards requests from `/api/*` to the Express server on port 4000

- **Extending the API**
  - Create new route files under `src/server/routes`
  - Export an Express router from each file and mount it in `src/server/index.ts`
  - Example: `GET /api/users`, `POST /api/posts`, etc.

## 5. Hosting Solutions

### Local Development

- Docker Compose runs both the Next.js front end and Express backend with a single command (`docker-compose up`)
- Environment variables managed in `.env.local`

### CI/CD

- **GitHub Actions** pipeline:
  - Installs dependencies
  - Runs ESLint and Prettier
  - Executes Jest tests
  - Builds the front end and back end

### Production Recommendations

- **Container Registry & Orchestration**
  - Push your Docker image to Docker Hub or GitHub Container Registry
  - Deploy on AWS ECS, Google Cloud Run, Heroku, or another platform that supports containers

- **Serverless Option**
  - You can deploy the Express API as AWS Lambda functions (via Serverless Framework or AWS SAM)
  - Host static Next.js files on Vercel or Netlify

## 6. Infrastructure Components

- **Docker & Docker Compose**
  - Defines how front end and back end run together locally

- **Reverse Proxy**
  - Next.js handles proxying requests during development
  - In production, use a real reverse proxy (NGINX or a cloud load balancer) to forward `/api` to your backend containers and serve static assets from a CDN

- **Continuous Integration**
  - GitHub Actions ensures every change meets quality standards before merging

- **(Future) Caching & CDN**
  - Add Redis or in-memory caching to speed up repeated data requests
  - Serve images and static assets through a CDN (CloudFront, Cloudflare)

## 7. Security Measures

- **Environment Variables**
  - All secrets (API keys, DB credentials) live in `.env.local`, never in source control

- **Protected `main` Branch**
  - Require all checks (lint, tests, build) to pass before merging

- **Dependency Scanning**
  - `npm audit` runs in CI to catch known vulnerabilities

- **HTTPS in Production**
  - Ensure your load balancer or reverse proxy terminates SSL/TLS

- **Authentication & Authorization (Future)**
  - Plan to add JWT or OAuth flows in later phases
  - Keep route handlers stateless by validating tokens on each request

## 8. Monitoring and Maintenance

- **Logging**
  - Basic `console.log` for now; structure logs so they can be parsed by log aggregators

- **Error Tracking**
  - Integrate a service like Sentry or LogRocket to catch unhandled exceptions

- **Metrics & Alerts**
  - Use Prometheus/Grafana or a cloud provider’s monitoring (CloudWatch, Datadog) to track response times, error rates, and CPU/memory usage

- **Maintenance Strategy**
  - Monthly dependency reviews and updates
  - Regular testing of migration scripts once a database is introduced
  - Keep Node.js version and Docker base images up to date for security patches

## 9. Conclusion and Overall Backend Summary

Testapp’s backend is a lightweight, TypeScript-based Express server with a single health check endpoint. It’s containerized for easy local setup, supported by a GitHub Actions pipeline that enforces code quality and runs tests on every change. While there’s no database yet, the structure is in place to plug in a relational or NoSQL database and add more RESTful routes under `/api`. Future enhancements include production hosting in containers or serverless, caching, a CDN for assets, formal authentication, and enterprise-grade monitoring. This setup aligns with our goal of zero-friction onboarding and provides a clear, maintainable path for growing into a full-featured application.