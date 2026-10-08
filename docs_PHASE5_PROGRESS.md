# GCScan progress — smart attendance work

## Completed in this working copy

- Client attendance now uses the authenticated Supabase user and the server RPC `gcscan_record_attendance`.
- QR metadata is no longer used to create or modify events during a student scan.
- Teacher event creation is insert-only and now persists the server-enforced grace-period and late-reason settings.
- Student history displays present, late, and recovered attendance states.
- Teacher Live Attendance Pulse displays recent attendees and their server-assigned status.
- Teacher recovery queue can approve or reject pending student recovery requests through `gcscan_review_recovery`.
- Student Recovery screen allows requests only for ended events without an existing attendance/recovery request.
- Recovery review approval creates a `recovered` attendance record server-side.
- Optional location support is prepared at the attendance API boundary (`latitude`/`longitude`) without adding a native location dependency yet.
- A performance migration for recovery foreign-key indexes was applied to the live Supabase project and is included locally.

## Not yet verified

- Full TypeScript check, Expo Doctor, Android build, device camera test, and end-to-end student/teacher UI test could not be completed here because dependency installation timed out.
- `expo-location` is not installed. No package/config changes were made for it.
- Live security advisor warnings remain intentionally visible for callable SECURITY DEFINER RPCs and existing RLS policy performance patterns.
