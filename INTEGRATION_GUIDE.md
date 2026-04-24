# Cloud Attendance System - Frontend Setup Guide

## Overview

This is a professional **Clock-In/Clock-Out** component for a Cloud Attendance System built with React, Vite, and Tailwind CSS. The system includes real-time clock display, geofencing capabilities, attendance logging, and seamless backend integration.

## Features

✅ **Real-time Clock Display** - Hours:Minutes:Seconds updating every second  
✅ **Geofencing Status** - Visual indicator showing office range status (Green/Red)  
✅ **Smart Clock Button** - Intelligent button logic based on clock-in status and location  
✅ **Location Tracking** - Custom `useGeolocation` hook with Haversine distance calculation  
✅ **Attendance Log** - Today's activity table with timestamps and location data  
✅ **Enterprise Design** - Modern, responsive UI with Lucide React icons  
✅ **State Management** - Full useState/useEffect implementation  
✅ **Loading States** - API call handling with loading indicators

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:

- `react@^19.2.5` - React library
- `react-dom@^19.2.5` - React DOM rendering
- `lucide-react@^0.394.0` - Icon library
- `tailwindcss@^3.4.1` - Utility-first CSS
- `postcss@^8.4.35` - CSS processing
- `autoprefixer@^10.4.18` - Autoprefixer plugin

### 2. Project Structure

```
src/
├── components/
│   └── AttendanceUI.jsx          # Main component
├── hooks/
│   └── useGeolocation.js         # Geolocation tracking hook
├── services/
│   └── attendanceService.js      # API service for backend
├── App.jsx                        # Root component
├── main.jsx                       # Entry point
├── index.css                      # Global styles with Tailwind
└── App.css                        # App-specific styles

tailwind.config.js                # Tailwind configuration
postcss.config.js                 # PostCSS configuration
```

## Configuration

### 1. Update Office Location

Edit `src/components/AttendanceUI.jsx` and update the office coordinates:

```javascript
const OFFICE_LATITUDE = 40.7128; // Your office latitude
const OFFICE_LONGITUDE = -74.006; // Your office longitude
const GEOFENCE_RADIUS = 100; // Radius in meters
```

### 2. Environment Variables

Create a `.env` file in your project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Attendance System
```

## Laravel Backend Integration

### Expected API Endpoints

Your Laravel backend should implement the following endpoints:

#### 1. **Toggle Attendance (Clock In/Out)**

```
POST /api/attendance/toggle
```

**Request Body:**

```json
{
  "type": "clock_in", // or "clock_out"
  "timestamp": "2024-04-24T10:30:45.000Z",
  "latitude": 40.7128,
  "longitude": -74.006
}
```

**Response:**

```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "id": 1,
    "type": "clock_in",
    "timestamp": "2024-04-24T10:30:45.000Z",
    "latitude": 40.7128,
    "longitude": -74.006
  }
}
```

#### 2. **Get Today's Attendance**

```
GET /api/attendance/today
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "clock_in",
      "timestamp": "2024-04-24T09:00:00.000Z",
      "latitude": 40.7128,
      "longitude": -74.006,
      "remarks": null
    }
  ]
}
```

#### 3. **Get Attendance History**

```
GET /api/attendance/history?start_date=2024-04-24&end_date=2024-04-25
```

#### 4. **Update Remarks**

```
PUT /api/attendance/{id}/remarks
```

**Request Body:**

```json
{
  "remarks": "Working from office"
}
```

#### 5. **Get Office Geofence**

```
GET /api/office/geofence
```

**Response:**

```json
{
  "success": true,
  "data": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "radius": 100
  }
}
```

#### 6. **Report Location** (Optional)

```
POST /api/location/report
```

**Request Body:**

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "timestamp": "2024-04-24T10:30:45.000Z"
}
```

### Using the API Service

The `src/services/attendanceService.js` provides ready-to-use methods:

```javascript
import {
  toggleAttendance,
  getTodayAttendance,
  getAttendanceHistory,
  getOfficeGeofence,
} from "./services/attendanceService";

// Clock in/out
await toggleAttendance({
  type: "clock_in",
  timestamp: new Date(),
  lat: 40.7128,
  lng: -74.006,
});

// Fetch today's logs
const logs = await getTodayAttendance();

// Fetch office geofence details
const geofence = await getOfficeGeofence();
```

## Updating AttendanceUI Component to Use Real API

Replace the placeholder API call in `src/components/AttendanceUI.jsx`:

**Current (Placeholder):**

```javascript
// Simulate API call
await new Promise((resolve) => setTimeout(resolve, 800));
```

**Update to:**

```javascript
import { toggleAttendance } from "../services/attendanceService";

// ... in handleClockToggle function
const response = await toggleAttendance({
  type: isClockedIn ? "clock_out" : "clock_in",
  timestamp,
  lat,
  lng,
});
```

## Development

### Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output in `dist/` directory

### Preview Production Build

```bash
npm run preview
```

## Component Features

### Real-time Clock

- Updates every second
- Displays time in HH:MM:SS format
- Shows date with day name

### Geofencing Status

- Real-time location tracking
- Haversine distance calculation
- Green badge for "In Range", Red for "Out of Range"
- Error handling with retry logic

### Smart Button Logic

- **Clocked Out:** Shows green "Clock In" button (disabled if out of range)
- **Clocked In:** Shows red "Clock Out" button (always enabled)
- Loading state with spinner during API calls
- Accessibility features

### Attendance Log

- Clean table display
- Timestamps with location coordinates
- Color-coded badges for Clock In/Out
- Status indicators
- Responsive design

## Browser Requirements

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Considerations

1. **Location Permissions** - Users must grant location access
2. **HTTPS** - Use HTTPS in production (geolocation requires secure context)
3. **Token Auth** - Implement Bearer token authentication in `attendanceService.js`
4. **CORS** - Configure CORS properly on your Laravel backend
5. **Rate Limiting** - Implement rate limiting for attendance endpoints

## Customization

### Colors

Edit `tailwind.config.js` to customize colors:

```javascript
colors: {
  primary: { /* Blue shades */ },
  success: { /* Green shades */ },
  danger: { /* Red shades */ },
}
```

### Icons

All icons from `lucide-react`. Replace or add more:

```javascript
import { Clock, MapPin, CheckCircle, AlertCircle, LogOut } from "lucide-react";
```

## Troubleshooting

### Geolocation Not Working

- Check browser geolocation permissions
- Ensure HTTPS in production
- Check browser console for errors

### API Calls Failing

- Verify backend URL in environment variables
- Check CORS headers on backend
- Verify authentication token in localStorage

### Styling Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Rebuild Tailwind: `npm run build`

## Support & Documentation

For questions or issues:

1. Check `src/hooks/useGeolocation.js` for hook documentation
2. Review `src/services/attendanceService.js` for API methods
3. Check component comments in `src/components/AttendanceUI.jsx`

---

**Version:** 1.0.0  
**Last Updated:** April 24, 2026  
**Built with:** React 19, Vite 8, Tailwind CSS 3, Lucide React
