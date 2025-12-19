
# Backend API Project  

Viktoriia Varennyk  
Gaetan Gendroz  
Ahmet Karabulut

## Overview

This project is a RESTful backend API built with **Node.js** and **Express**, designed to manage clients, dogs, races, diseases, services, and related entities. The API follows a clear CRUD-based structure and is fully documented using **Swagger (OpenAPI 3.0)**.

The Swagger documentation is the single source of truth for endpoints, request/response schemas, and examples. This README focuses on setup and architecture to avoid redundancy.

## Tech Stack

* **Node.js / Express**
* **MySQL** (relational data model)
* **Swagger / OpenAPI 3.0**
* **ES Modules (.mjs)**

## Project Structure

```
Projet-Backend-develop/
├── app.mjs              # Application entry point
├── package.json         # Dependencies and scripts
├── swagger.js           # Swagger configuration
├── routes/              # API route definitions
├── db/                  # Database connection and SQL schema
├── docs/                # Swagger spec and data models
└── README.md
```

## Installation

```bash
npm install
```

## Environment Configuration

Ensure a MySQL database is available and update the database connection settings in:

```
db/db.js
```

An SQL initialization script is provided:

```
db/dogs.sql
```

## Running the Server

```bash
npm run dev
```

The API will be available at:

```
http://localhost:3003
```

## API Documentation (Swagger)

Swagger documentation is available once the server is running:

```
http://localhost:3003/api-docs
```

It includes:

* All available endpoints
* Request and response schemas
* Validation rules
* Example payloads

## Database Design

The database design artifacts are available in the `docs/` folder:

* Conceptual and logical data models
* Class diagram

These documents describe entity relationships and constraints used by the API.

## Notes

* All business logic is handled through route modules.
* Input validation and data consistency follow the schemas defined in Swagger.
* No authentication layer is implemented by default.

## License

This project is intended for educational and internal use.
