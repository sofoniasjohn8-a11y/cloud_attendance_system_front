# Working Endpoints — Cloud Attendance System

All endpoints consumed by the frontend. Base URL: `http://localhost:8000/api` (override with `VITE_API_BASE_URL`).

Legend: 🔒 = Bearer token required · 👑 = Admin role required

---

## Auth

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|--------------|----------|
| POST | `/register` | — | `{ name, email, password }` | `{ token, user }` |
| POST | `/login` | — | `{ email, password }` | `{ token, user, office }` |
| POST | `/logout` | 🔒 | — | `204 No Content` |
| GET | `/me` | 🔒 | — | User object |

### Register notes
- `office_id` is **optional** — backend auto-assigns the user to the first available office
- Backend auto-creates Ethiopian work schedules for the new user (see [Ethiopian Schedules](#ethiopian-work-schedules))

### Login response
```json
{
  "token": "<bearer_token>",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee"
  },
  "office": {
    "id": 1,
    "name": "Main Office",
    "latitude": "9.0300",
    "longitude": "38.7400",
    "radius": 100
  }
}
```

> Frontend stores `token` → `auth_token` and `user` → `current_user` in localStorage.  
> If `user.role === 'admin'`, frontend redirects to `/admin`; otherwise to `/attendance`.

---

## Offices

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|--------------|----------|
| GET | `/offices` | 🔒 | — | Array of office objects |
| POST | `/offices` | 🔒 | `{ name, latitude, longitude, radius }` | Created office object |
| PUT | `/offices/{id}` | 🔒 | `{ name, latitude, longitude, radius }` | Updated office object |
| DELETE | `/offices/{id}` | 🔒 | — | `204 No Content` |

### Office object
```json
{
  "id": 1,
  "name": "Main Office",
  "latitude": "9.0300",
  "longitude": "38.7400",
  "radius": 100
}
```

> `latitude` / `longitude` may be strings — frontend calls `parseFloat()`.  
> `radius` is in meters; defaults to `100` if null/missing.  
> Frontend uses the **first** office in the array for geofencing.

---

## Attendances

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|--------------|----------|
| GET | `/attendances` | 🔒 | — | Array of attendance objects |
| POST | `/attendances` | 🔒 | `{ latitude, longitude }` | Created attendance object |
| PUT | `/attendances/{id}` | 🔒 | `{ clock_out }` | Updated attendance object |
| DELETE | `/attendances/{id}` | 🔒 | — | `204 No Content` |

### Clock-in request
```json
{ "latitude": 9.0300, "longitude": 38.7400 }
```
> `office_id` is **not sent** — backend auto-detects it from the authenticated user's profile.

### Clock-out request
```json
{ "clock_out": "2024-01-15 17:00:00" }
```

### Attendance object
```json
{
  "id": 1,
  "clock_in": "2024-01-15T08:30:00.000000Z",
  "clock_out": "2024-01-15T17:00:00.000000Z",
  "lat_in": "9.0300",
  "lng_in": "38.7400",
  "status": "present"
}
```

> `clock_out` is `null` when still clocked in.  
> Frontend filters by today's date using `clock_in`.  
> If the last record has `clock_out: null`, user is restored as clocked-in on page load.

---

## Schedules

| Method | Endpoint | Auth | Request Body |
|--------|----------|------|--------------|
| GET | `/schedules` | 🔒 | — |
| POST | `/schedules` | 🔒 | `{ name, start_time, end_time, ... }` |
| GET | `/schedules/{id}` | 🔒 | — |
| PUT | `/schedules/{id}` | 🔒 | `{ name, start_time, end_time, ... }` |
| DELETE | `/schedules/{id}` | 🔒 | — |

> Consumed via `attendanceService.js` but not yet rendered in the UI.

---

## Admin Endpoints

All admin endpoints require 🔒 Bearer token + 👑 admin role.

| Method | Endpoint | Purpose | Query / Body |
|--------|----------|---------|--------------|
| GET | `/admin/overview` | Daily attendance breakdown | `?date=2024-01-15` |
| GET | `/admin/calendar` | Monthly calendar view | `?month=1&year=2024` |
| GET | `/admin/users` | List all users | — |
| GET | `/admin/users/{id}` | Get single user | — |
| PUT | `/admin/users/{id}/role` | Update user role | `{ role }` |
| DELETE | `/admin/users/{id}` | Delete user | — |
| PUT | `/admin/attendances/{id}` | Override attendance record | `{ clock_in, clock_out, status, ... }` |
| POST | `/admin/notify/absent` | Notify one absent user | `{ user_id, date }` |
| POST | `/admin/notify/absent-all` | Notify all absent users | `{ date }` |

### Admin overview response
```json
{
  "schedule_breakdown": [
    {
      "user_id": 1,
      "name": "John Doe",
      "schedule": "Morning Shift",
      "clock_in": "08:30",
      "clock_out": null,
      "status": "present"
    }
  ]
}
```

> `status` values: `"present"` · `"late"` · `"absent"`

### Admin calendar response
```json
{
  "days": [
    { "date": "2024-01-15", "present": 12, "absent": 3, "late": 2 }
  ]
}
```

---

## Notifications

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/notifications` | 🔒 | List user's notifications |
| PUT | `/notifications/{id}/read` | 🔒 | Mark one notification as read |
| PUT | `/notifications/read-all` | 🔒 | Mark all notifications as read |
| DELETE | `/notifications/{id}` | 🔒 | Delete a notification |

> Notifications are triggered by admin absence alerts (`/admin/notify/absent` and `/admin/notify/absent-all`).  
> Displayed in the UI via `NotificationBell.jsx`.

---

## Reports

| Method | Endpoint | Auth | Query Params |
|--------|----------|------|--------------|
| GET | `/reports/monthly` | 🔒 | `?month=2024-01` (optional) |

---

## Health Check

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check if API is reachable |

---

## Ethiopian Work Schedules

When a user registers, the backend auto-creates two schedule templates based on Ethiopian standard working hours:

| Shift | Start | End | Days |
|-------|-------|-----|------|
| Morning Shift | 08:00 | 12:00 | Mon–Fri |
| Afternoon Shift | 13:00 | 17:00 | Mon–Fri |

> Late threshold and grace period are configured server-side per schedule.  
> Schedules are accessible via `GET /schedules` and managed via `attendanceService.js`.

---

## All Endpoints Summary

| # | Method | Endpoint | Auth |
|---|--------|----------|------|
| 1 | POST | `/register` | — |
| 2 | POST | `/login` | — |
| 3 | POST | `/logout` | 🔒 |
| 4 | GET | `/me` | 🔒 |
| 5 | GET | `/offices` | 🔒 |
| 6 | POST | `/offices` | 🔒 |
| 7 | PUT | `/offices/{id}` | 🔒 |
| 8 | DELETE | `/offices/{id}` | 🔒 |
| 9 | GET | `/attendances` | 🔒 |
| 10 | POST | `/attendances` | 🔒 |
| 11 | PUT | `/attendances/{id}` | 🔒 |
| 12 | DELETE | `/attendances/{id}` | 🔒 |
| 13 | GET | `/schedules` | 🔒 |
| 14 | POST | `/schedules` | 🔒 |
| 15 | GET | `/schedules/{id}` | 🔒 |
| 16 | PUT | `/schedules/{id}` | 🔒 |
| 17 | DELETE | `/schedules/{id}` | 🔒 |
| 18 | GET | `/reports/monthly` | 🔒 |
| 19 | GET | `/health` | — |
| 20 | GET | `/admin/overview` | 🔒 👑 |
| 21 | GET | `/admin/calendar` | 🔒 👑 |
| 22 | GET | `/admin/users` | 🔒 👑 |
| 23 | GET | `/admin/users/{id}` | 🔒 👑 |
| 24 | PUT | `/admin/users/{id}/role` | 🔒 👑 |
| 25 | DELETE | `/admin/users/{id}` | 🔒 👑 |
| 26 | PUT | `/admin/attendances/{id}` | 🔒 👑 |
| 27 | POST | `/admin/notify/absent` | 🔒 👑 |
| 28 | POST | `/admin/notify/absent-all` | 🔒 👑 |
| 29 | GET | `/notifications` | 🔒 |
| 30 | PUT | `/notifications/{id}/read` | 🔒 |
| 31 | PUT | `/notifications/read-all` | 🔒 |
| 32 | DELETE | `/notifications/{id}` | 🔒 |
