# Cloud Attendance System — Frontend

React + Vite frontend with face recognition (browser-side), geofencing, and clock-in/out connected to a Laravel backend.

---

## Tech Stack

- React 19, Vite
- Tailwind CSS
- react-router-dom
- lucide-react (icons)

---

## Project Structure

```
src/
├── components/
│   ├── AttendanceUI.jsx      # Main clock-in/out screen
│   ├── RegisterPage.jsx      # User registration
│   └── LoginPage.jsx         # Login
├── hooks/
│   └── useGeolocation.js     # Geofencing hook (Haversine formula)
├── services/
│   └── attendanceService.js  # All backend API calls
├── constants.js              # API endpoints, config values
└── App.jsx                   # Routes
```

---

## Routes

| Path | Component | Protected |
|------|-----------|-----------|
| `/register` | RegisterPage | No |
| `/login` | LoginPage | No |
| `/attendance` | AttendanceUI | Yes (requires `current_user` in localStorage) |
| `*` | Redirect to `/login` | — |

---

## User Flow

### 1. Register
- User fills in name, email, password
- Calls `POST /api/register` → stores `auth_token` and `current_user` in localStorage
- Redirects to `/attendance`

### 2. Login
- User enters email + password
- Calls `POST /api/login` → stores `auth_token` and `current_user` in localStorage
- Redirects to `/attendance`

### 3. Clock In / Clock Out
- Loads office coordinates from `GET /api/offices` (uses first office)
- Geofence check using Haversine formula — user must be within `radius` meters
- Clock In → `POST /api/attendances`
- Clock Out → `PUT /api/attendances/{id}`
- Logout clears `current_user` and redirects to `/login`

---

## Backend API Consumed

Base URL: `http://localhost:8000/api` (override with `VITE_API_BASE_URL` in `.env`)

### Auth

| Method | Endpoint | Auth | Purpose | Request Body | Expected Response |
|--------|----------|------|---------|--------------|-------------------|
| POST | `/api/register` | — | Register user | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/login` | — | Login user | `{ email, password }` | `{ token, user }` |
| POST | `/api/logout` | 🔒 Bearer | Revoke token | — | `204 No Content` |
| GET | `/api/me` | 🔒 Bearer | Get current user | — | User object |

Expected `user` object in register/login response:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

> Token is stored in `localStorage` as `auth_token` and sent as `Authorization: Bearer <token>` on all subsequent requests.

---

### Offices

| Method | Endpoint | Purpose | Request Body | Expected Response |
|--------|----------|---------|--------------|-------------------|
| GET | `/api/offices` | Load office geofence config | — | Array of office objects |
| POST | `/api/offices` | Create office | `{ name, latitude, longitude, radius }` | Created office object |
| PUT | `/api/offices/{id}` | Update office | `{ name, latitude, longitude, radius }` | Updated office object |
| DELETE | `/api/offices/{id}` | Delete office | — | `204 No Content` |

Office object fields the frontend reads:
```json
{
  "id": 1,
  "name": "Main Office",
  "latitude": "3.1390",
  "longitude": "101.6869",
  "radius": 100
}
```
> `latitude` and `longitude` can be strings or numbers — frontend calls `parseFloat()` on them.
> `radius` is in **meters**. If null/missing, defaults to `100`.

---

### Attendances

| Method | Endpoint | Purpose | Request Body | Expected Response |
|--------|----------|---------|--------------|-------------------|
| GET | `/api/attendances` | Load today's records on mount | — | Array of attendance objects |
| POST | `/api/attendances` | Clock in | `{ latitude, longitude }` | Created attendance object |
| PUT | `/api/attendances/{id}` | Clock out | `{ latitude, longitude }` | Updated attendance object |
| DELETE | `/api/attendances/{id}` | Delete record | — | `204 No Content` |

Attendance object fields the frontend reads:
```json
{
  "id": 1,
  "clock_in": "2024-01-15T08:30:00.000000Z",
  "clock_out": "2024-01-15T17:00:00.000000Z",
  "latitude": "3.1390",
  "longitude": "101.6869"
}
```
> `clock_out` is `null` when the user is still clocked in.
> Frontend filters records by today's date using `clock_in`.
> If the last record has `clock_out: null`, the user is restored as clocked-in on page load.

---

### Schedules

| Method | Endpoint | Purpose | Request Body |
|--------|----------|---------|--------------|
| GET | `/api/schedules` | List schedules | — |
| POST | `/api/schedules` | Create schedule | `{ name, start_time, end_time, ... }` |
| GET | `/api/schedules/{id}` | Get schedule | — |
| PUT | `/api/schedules/{id}` | Update schedule | `{ name, start_time, end_time, ... }` |
| DELETE | `/api/schedules/{id}` | Delete schedule | — |

> Schedules are available via `attendanceService.js` but not yet rendered in the UI.

---

### Reports

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/api/reports/monthly` | Monthly report | `?month=2024-01` (optional) |

---

### Health Check

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Check if API is reachable |

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Face Recognition (Frontend-only)

- Library: `@vladmandic/face-api` (runs on TensorFlow.js in browser)
- Models loaded from `/public/models/` at runtime (~6MB, loaded once)
- Face descriptor: 128-dimensional Float32Array
- Stored in `localStorage` as a plain number array under `face_users[email]`
- Matching: euclidean distance `< 0.5` = verified

### localStorage Keys

| Key | Value |
|-----|-------|
| `auth_token` | Bearer token returned from `/api/login` or `/api/register` |
| `current_user` | `{ id, name, email }` — set on login/register, cleared on logout |

> **Note for backend migration:** When you add real auth (JWT/Sanctum), replace `localStorage` user storage with API calls to `POST /api/auth/register` and `POST /api/auth/login`. The face descriptor can be sent to the backend as a JSON array and stored per user in the database for server-side verification.

---

## Running Locally

```bash
npm install --legacy-peer-deps
npm run dev
```

> `--legacy-peer-deps` is required because `lucide-react@0.394.0` declares peer dependency on React `^16-18` but this project uses React 19.

---

## Backend Migration Notes

Auth is fully connected to the backend via `/api/register` and `/api/login`. Token is stored in `localStorage` as `auth_token` and sent as `Authorization: Bearer <token>` on all subsequent requests.
