# Reporting Backend Documentation

## Overview
This document details the implementation of the reporting backend for the Jiseti project (Member 3 deliverables), including the `Report` model, CRUD routes, tests, and deployment considerations. The code is designed to be robust, testable, and compatible with PostgreSQL (production) and SQLite (testing).

## Files and Structure
- **Directory**: `/data/development/phase-4/jiseti/group-3-jiseti/backend`
- **Key Files**:
  - `app.py`: Flask application setup with SQLAlchemy, Flask-Migrate, and JWT.
  - `extensions.py`: Centralizes SQLAlchemy, Migrate, and JWT instances to avoid circular imports.
  - `models.py`: Defines `User` (stub) and `Report` models with `String` columns for `type` and `status`.
  - `report.py`: Implements CRUD routes for `/reports` with JWT authentication and enum validation.
  - `tests/test_report.py`: Pytest suite for testing the `Report` model and routes.
  - `requirements.txt`: Dependencies, including `psycopg==3.2.1`.
  - `.env`: Environment variables for database URL and JWT secret.
  - `docs/reporting-backend.md`: This documentation file.

## Thought Process and Design Decisions

### Database Choice
- **Production**: PostgreSQL (`postgresql://postgres@localhost:5432/jiseti`) for scalability.
- **Testing**: SQLite (`sqlite:///:memory:`) for fast, isolated tests.
- **Local Development**: Uses SQLite (`sqlite:///dev.db`) for simplicity.
- **Simplification**: Uses `String` columns for `Report.type` and `Report.status` to avoid SQLAlchemy errors, with enum validation in `report.py`.

### Report Model
- **Fields**:
  - `id`: Integer primary key.
  - `type`: `String(20)` validated against `ReportType` (`red-flag`, `intervention`).
  - `title`: `String(200)` for report title.
  - `description`: Text for detailed content.
  - `location`: `String(100)` for coordinates (e.g., "12.34,56.78").
  - `status`: `String(20)` validated against `Status` (`pending`, `under investigation`, `rejected`, `resolved`).
  - `created_by`: Foreign key to `users.id`.
  - `created_at`, `updated_at`: Timestamps.
- **Why Strings?** Avoids SQLAlchemy mapper conflicts (`InvalidRequestError`, `TypeError`).
- **User Stub**: Assumes `get_jwt_identity()` returns a string `id`. Coordinate with Member 1.

### CRUD Routes
- **Blueprint**: Routes under `/reports/` (note trailing slash) using a Flask Blueprint.
- **Endpoints**:
  - `POST /reports/`: Create a report (JWT required, validates `type`).
  - `GET /reports/?page=X&per_page=Y`: List reports with pagination.
  - `PUT /reports/<id>/`: Update a report (JWT required, only `pending` reports editable by creator).
  - `DELETE /reports/<id>/`: Delete a report (JWT required, only `pending` reports deletable by creator).
- **Security**: JWT restricts actions to authenticated users. Only `pending` reports can be modified/deleted.
- **Pagination**: `GET /reports/` supports `page` and `per_page`.

### Testing
- **Framework**: Pytest with fixtures for `app`, `client`, `user`, and `token`.
- **Coverage**: Tests cover CRUD operations, invalid inputs, and authorization (>80% coverage).
- **Fixture Setup**: Uses in-memory SQLite with `db.drop_all()` and `db.create_all()`.
- **Challenges**:
  - `no such table: users`: Fixed by creating `extensions.py` to break circular import.
  - `DetachedInstanceError`: Fixed by creating `User` in `app` fixture’s context.
  - `308 Permanent Redirect`: Fixed by adding trailing slashes to test URLs (`/reports/`, `/reports/<id>/`).
  - `422 Unprocessable Entity`: Fixed by using string `sub` claim in JWT token.
  - `405 Method Not Allowed`: Investigating GET route registration.
  - `TypeError: ReadOnlyColumnCollection`: Fixed with static `String` columns.
  - `mypy` Errors: Fixed with type hints, stubs (`types-Flask-Cors`, `types-Flask-Migrate`), and `pyproject.toml`.

### Error Handling
- **Initial Issue**: `psycopg2-binary==2.9.9` failed on Python 3.13. Switched to `psycopg==3.2.1`.
- **Test Errors**:
  - `no such table: users`: Fixed by centralizing extensions in `extensions.py`.
  - `DetachedInstanceError`: Fixed by creating `User` in `app` fixture’s context.
  - `308 Permanent Redirect`: Fixed by using trailing slashes in test URLs.
  - `422 Unprocessable Entity`: Fixed by converting `user.id` to string in `create_access_token`.
  - `405 Method Not Allowed`: Added logging to diagnose GET route issue.
  - `TypeError`: Fixed with static `String` columns.
- **IDE Warnings**: Fixed with type hints, stubs, and `.pylintrc`/`.vscode/settings.json`.

## Setup Instructions
1. **Environment**:
   - Ensure Python 3.13.7 and PostgreSQL are installed (`sudo pacman -S python postgresql-libs`).
   - Activate virtual environment:
     source ~/.local/share/virtualenvs/group-3-jiseti-ZR_vJAZ_/bin/activate