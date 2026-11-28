
# Data Storage — SQLite and Photo Files

**Project:** Little Beaver Tracker  
**Component:** Data Storage  
**Scope:** Local persistence, history queries, daily summaries,
photo attachments, and data integrity.

## 1. Setup

Install dependencies:

```bash
npm ci
```

Start the application:

```bash
npx expo start
```

Run validation:

```bash
npx jest --ci
npx tsc --noEmit
npm run lint
```

The application uses Expo SQLite for local, offline-first
storage. Database initialization is handled by
`services/database/database.ts`.

The schema is defined in `services/database/schema.ts`.
Foreign-key enforcement is enabled using
`PRAGMA foreign_keys = ON`.

## 2. Database Schema

| Table | Purpose |
| --- | --- |
| `babies` | Baby profiles and birth dates |
| `feeding_events` | Feeding type, amount, unit, notes, and time |
| `diaper_events` | Diaper type, notes, and time |
| `measurements` | Weight, length, head circumference, and time |
| `photo_attachments` | Photo metadata and event associations |

Each table uses a unique ID as its primary key.

Event and photo records reference their associated baby
using `baby_id`.

The `photo_attachments` table can associate a photo with
a feeding, diaper, or measurement event through
`event_id` and `event_type`.

Indexes support efficient history and photo queries.

## 3. Database APIs

### Baby profiles

File: `services/database/babies.ts`

- `createBaby()`
- `getBabyById()`
- `getAllBabies()`
- `updateBaby()`
- `deleteBaby()`

### Feeding events

File: `services/database/feedings.ts`

- `createFeedingEvent()`
- `getFeedingEventsByBaby()`
- `updateFeedingEvent()`
- `deleteFeedingEvent()`

### Diaper events

File: `services/database/diapers.ts`

- `createDiaperEvent()`
- `getDiaperEventsByBaby()`
- `updateDiaperEvent()`
- `deleteDiaperEvent()`

### Measurements

File: `services/database/measurements.ts`

- `createMeasurement()`
- `getMeasurementsByBaby()`
- `updateMeasurement()`
- `deleteMeasurement()`

### History and summaries

- `getEventHistory()` in `history.ts`
- `getDailySummary()` in `dailySummary.ts`

History queries support filtering by baby and date range.
Daily summaries use the device-local calendar day.

## 4. Photo Storage

Files:

- `services/database/photos.ts`
- `services/database/photoStorage.ts`

Photo storage follows this process:

1. The UI obtains a photo URI from the image picker.
2. `savePhoto()` copies the photo into application storage.
3. The database stores the managed filename.
4. `listBabyPhotos()` and `listEventPhotos()` return
   full URIs suitable for displaying images.
5. `removePhoto()` deletes the database attachment
   and then removes the stored image file.

The application stores photos in its document directory
under `baby-photos`.

Original images are copied, not moved or deleted.

UI code should call `savePhoto()` rather than inserting
image-picker URIs directly through `createPhotoAttachment()`.

## 5. Data Integrity

The database implementation provides the following
protections:

### Unique records

Primary-key constraints prevent duplicate record IDs.

### Baby ownership

Event updates verify both the event ID and baby ID.
This prevents an existing event from accidentally being
reassigned to another baby.

### Transactional deletion

`deleteBaby()` deletes related database records within
one transaction.

`deleteEventAndPhotos()` coordinates deletion of feeding,
diaper, or measurement events with their photo attachments.

If a database operation fails, the transaction is
rolled back.

### Safe photo cleanup

Physical photo files are removed only after the relevant
database transaction succeeds.

`cleanupStoredPhotoFiles()` rejects unsafe filenames and
absolute paths to avoid deleting files outside the
application's managed photo directory.

If physical file deletion fails, the application logs
a warning rather than reporting a database rollback.

## 6. Testing

Automated tests are located in
`services/database/*.test.ts`.

Relevant tests include:

- `babies.test.ts`
- `feedings.test.ts`
- `diapers.test.ts`
- `photos.test.ts`
- `photoStorage.test.ts`
- `eventDeletion.test.ts`
- `schemaIntegrity.test.ts`

The tests cover CRUD operations, event ownership,
photo attachment validation, deletion behavior,
and error handling.

Mock-based tests validate service behavior, while
actual SQLite transaction behavior requires integration
testing.

## 7. Final Device Verification

The following scenarios should be checked on a device:

1. Create two baby profiles.
2. Record feeding, diaper, and measurement events.
3. Verify events appear under the correct baby.
4. Edit and delete events without affecting another baby.
5. Attach a photo and verify it displays after restarting.
6. Delete a photo and verify its attachment is removed.
7. Delete an event with attached photos.
8. Delete a baby with several associated records.
9. Verify daily summaries around local midnight.
10. Verify that duplicate record IDs are rejected.

## 8. Known Limitations

- Storage is local to the device; there is no cloud sync.
- Existing legacy photo records containing absolute
  image-picker paths are not automatically migrated.
- Future database schema changes may require migrations.
- Final UI integration and device testing must be
  completed after teammates' changes are merged.
