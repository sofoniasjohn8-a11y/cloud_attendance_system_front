# API Contract - Cloud Attendance System

**Frontend Version:** 1.0.0  
**Created:** April 24, 2026  
**Status:** Production Ready

---

## Overview

This document specifies the API contract between the React frontend and Laravel backend for the Cloud Attendance System.

## Base URL

```
{BACKEND_URL}/api
```

Example: `http://localhost:8000/api`

## Authentication

All endpoints (except authentication endpoints) require a Bearer token:

```
Authorization: Bearer {AUTH_TOKEN}
```

## Response Format

All responses follow a consistent JSON structure:

### Success Response (HTTP 200)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* Endpoint-specific data */
  }
}
```

### Error Response (HTTP 400+)

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    /* Optional field-specific errors */
  }
}
```

---

## Endpoints

### 1. Toggle Attendance (Clock In/Out)

**Endpoint:**

```
POST /attendance/toggle
```

**Description:** Records a clock in or clock out action with location data.

**Request Body:**

```json
{
  "type": "clock_in", // or "clock_out"
  "timestamp": "2024-04-24T10:30:45.000Z",
  "latitude": 40.7128,
  "longitude": -74.006
}
```

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer {AUTH_TOKEN}
```

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "type": "clock_in",
    "timestamp": "2024-04-24T10:30:45.000Z",
    "latitude": 40.7128,
    "longitude": -74.006,
    "remarks": null,
    "created_at": "2024-04-24T10:30:45.000Z",
    "updated_at": "2024-04-24T10:30:45.000Z"
  }
}
```

**Error Response (HTTP 400):**

```json
{
  "success": false,
  "message": "Out of office range, cannot clock in",
  "errors": null
}
```

**Status Codes:**

- `200` - Success
- `400` - Out of range / Invalid data
- `401` - Unauthorized
- `422` - Validation error

**Notes:**

- Validate geofence distance on backend
- Prevent duplicate clock-ins/outs
- Store full timestamp with timezone

---

### 2. Get Today's Attendance

**Endpoint:**

```
GET /attendance/today
```

**Description:** Fetch all attendance records for the current day.

**Request Headers:**

```
Authorization: Bearer {AUTH_TOKEN}
```

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "type": "clock_in",
      "timestamp": "2024-04-24T09:00:00.000Z",
      "latitude": 40.7128,
      "longitude": -74.006,
      "remarks": null,
      "created_at": "2024-04-24T09:00:00.000Z"
    },
    {
      "id": 2,
      "user_id": 123,
      "type": "clock_out",
      "timestamp": "2024-04-24T17:30:00.000Z",
      "latitude": 40.7128,
      "longitude": -74.006,
      "remarks": "Daily work completed",
      "created_at": "2024-04-24T17:30:00.000Z"
    }
  ]
}
```

**Query Parameters:** None

**Status Codes:**

- `200` - Success
- `401` - Unauthorized

---

### 3. Get Attendance History

**Endpoint:**

```
GET /attendance/history
```

**Description:** Fetch attendance records for a date range.

**Request Headers:**

```
Authorization: Bearer {AUTH_TOKEN}
```

**Query Parameters:**

```
start_date=2024-04-20&end_date=2024-04-24
```

**Parameters:**
| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| start_date | string | Yes | YYYY-MM-DD | Start date inclusive |
| end_date | string | Yes | YYYY-MM-DD | End date inclusive |

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": [
    {
      "date": "2024-04-24",
      "records": [
        {
          "id": 1,
          "user_id": 123,
          "type": "clock_in",
          "timestamp": "2024-04-24T09:00:00.000Z",
          "latitude": 40.7128,
          "longitude": -74.006,
          "remarks": null
        }
      ]
    }
  ]
}
```

**Status Codes:**

- `200` - Success
- `400` - Invalid date format
- `401` - Unauthorized

---

### 4. Update Attendance Remarks

**Endpoint:**

```
PUT /attendance/{id}/remarks
```

**Description:** Add or update remarks for a specific attendance record.

**Request Body:**

```json
{
  "remarks": "Working from office today"
}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Attendance record ID |

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Remarks updated successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "type": "clock_in",
    "timestamp": "2024-04-24T09:00:00.000Z",
    "latitude": 40.7128,
    "longitude": -74.006,
    "remarks": "Working from office today",
    "updated_at": "2024-04-24T10:30:00.000Z"
  }
}
```

**Status Codes:**

- `200` - Success
- `404` - Record not found
- `401` - Unauthorized
- `422` - Validation error

---

### 5. Get Office Geofence

**Endpoint:**

```
GET /office/geofence
```

**Description:** Fetch office location and geofence radius configuration.

**Request Headers:**

```
Authorization: Bearer {AUTH_TOKEN}
```

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Geofence configuration retrieved",
  "data": {
    "id": 1,
    "office_name": "Head Office",
    "latitude": 40.7128,
    "longitude": -74.006,
    "radius_meters": 100,
    "address": "123 Main St, New York, NY 10001",
    "timezone": "America/New_York"
  }
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized

**Notes:**

- Can be called once at app startup and cached
- Frontend should validate against this when clocking in

---

### 6. Report Location (Optional)

**Endpoint:**

```
POST /location/report
```

**Description:** Report user location periodically for audit trail.

**Request Body:**

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "timestamp": "2024-04-24T10:30:45.000Z"
}
```

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Location logged successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "latitude": 40.7128,
    "longitude": -74.006,
    "timestamp": "2024-04-24T10:30:45.000Z",
    "created_at": "2024-04-24T10:30:45.000Z"
  }
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `422` - Validation error

**Notes:**

- Optional endpoint - can be called periodically
- Useful for tracking user movement throughout day

---

## HTTP Status Codes

| Code | Meaning              | Usage                        |
| ---- | -------------------- | ---------------------------- |
| 200  | OK                   | Successful operation         |
| 400  | Bad Request          | Invalid input / Out of range |
| 401  | Unauthorized         | Missing or invalid token     |
| 404  | Not Found            | Resource not found           |
| 422  | Unprocessable Entity | Validation failed            |
| 500  | Server Error         | Internal server error        |

---

## Request/Response Examples

### Example 1: Clock In

**Request:**

```bash
curl -X POST http://localhost:8000/api/attendance/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "clock_in",
    "timestamp": "2024-04-24T09:00:00.000Z",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "id": 5,
    "user_id": 123,
    "type": "clock_in",
    "timestamp": "2024-04-24T09:00:00.000Z",
    "latitude": 40.7128,
    "longitude": -74.006,
    "remarks": null,
    "created_at": "2024-04-24T09:00:00.000Z"
  }
}
```

### Example 2: Get Today's Records

**Request:**

```bash
curl -X GET http://localhost:8000/api/attendance/today \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "type": "clock_in",
      "timestamp": "2024-04-24T09:00:00.000Z",
      "latitude": 40.7128,
      "longitude": -74.006,
      "remarks": null
    },
    {
      "id": 2,
      "user_id": 123,
      "type": "clock_out",
      "timestamp": "2024-04-24T17:30:00.000Z",
      "latitude": 40.7128,
      "longitude": -74.006,
      "remarks": "Day completed"
    }
  ]
}
```

---

## Data Validation Rules

### Attendance Toggle Request

- `type`: Must be "clock_in" or "clock_out"
- `timestamp`: Valid ISO 8601 format
- `latitude`: Number between -90 and 90
- `longitude`: Number between -180 and 180

### Update Remarks Request

- `remarks`: String, max 500 characters, optional

---

## CORS Configuration

Frontend will be at: `http://localhost:5173` (development)

Backend must allow CORS from frontend domain:

```php
// config/cors.php (Laravel)
'allowed_origins' => ['http://localhost:5173', 'https://yourdomain.com'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
'allowed_headers' => ['Content-Type', 'Authorization'],
'exposed_headers' => ['Content-Length'],
'max_age' => 86400,
```

---

## Error Scenarios

### Out of Range Error

```json
{
  "success": false,
  "message": "You are out of office range. Cannot clock in.",
  "code": "OUT_OF_RANGE"
}
```

### Already Clocked In

```json
{
  "success": false,
  "message": "You are already clocked in. Cannot clock in again.",
  "code": "DUPLICATE_CLOCK_IN"
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized access",
  "code": "UNAUTHORIZED"
}
```

---

## Implementation Checklist

**Database Schema:**

- [ ] Create `attendances` table with columns:
  - `id` (primary key)
  - `user_id` (foreign key)
  - `type` (enum: clock_in, clock_out)
  - `timestamp` (datetime)
  - `latitude` (decimal)
  - `longitude` (decimal)
  - `remarks` (text, nullable)
  - `created_at`, `updated_at` (timestamps)

- [ ] Create `offices` table with columns:
  - `id` (primary key)
  - `office_name` (string)
  - `latitude` (decimal)
  - `longitude` (decimal)
  - `radius_meters` (integer)
  - `address` (text)
  - `timezone` (string)

- [ ] Create `location_logs` table (optional)

**API Routes:**

- [ ] `POST /api/attendance/toggle` - Authentication, validation, geofence check
- [ ] `GET /api/attendance/today` - User's records only
- [ ] `GET /api/attendance/history` - User's records with date range
- [ ] `PUT /api/attendance/{id}/remarks` - Update remarks
- [ ] `GET /api/office/geofence` - Office configuration
- [ ] `POST /api/location/report` - Location logging

**Middleware:**

- [ ] Authentication middleware
- [ ] CORS middleware
- [ ] Rate limiting
- [ ] Request validation

**Features:**

- [ ] Geofence distance validation
- [ ] Duplicate prevention (no multiple clocks same time)
- [ ] Time zone handling
- [ ] Audit logging
- [ ] Error handling and logging

---

## Notes for Backend Developer

1. **Geofence Validation**: Always validate distance on backend using same Haversine formula
2. **Timezone Handling**: Store all timestamps as UTC, apply timezone for display
3. **Duplicate Prevention**: Check if already clocked in/out today
4. **Rate Limiting**: Implement to prevent abuse (e.g., 100 requests/hour per user)
5. **Logging**: Log all API calls for audit trail
6. **Error Messages**: Return clear, specific error messages
7. **Data Integrity**: Ensure database constraints match business rules

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0.0   | 2024-04-24 | Initial release |

---

**Last Updated:** April 24, 2026  
**Contact:** Development Team
