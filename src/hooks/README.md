# Active Baby Feature

## Overview

The Active Baby feature allows the application to maintain a single selected baby profile across multiple screens. Users can select a baby once and all future events are automatically associated with that profile until the active baby is changed or cleared.

## Purpose

Without an active baby, users would need to manually select a baby each time they record a feeding, diaper change, measurement, or view history. The Active Baby system simplifies navigation and reduces data-entry mistakes.

## Components

### ActiveBabyProvider

Stores the currently selected baby and provides access to that information throughout the application using React Context.

### useActiveBaby Hook

Provides a simple interface for components to access:

- activeBaby
- setActiveBaby

The hook also verifies that components are being used within an ActiveBabyProvider.

## Current Usage

The Active Baby feature is used by:

- HomeScreen
- BabyProfileScreen
- ManualFeedingScreen
- ManualDiaperScreen
- HistoryScreen

## Workflow

1. User selects a baby from the Baby Profiles screen.
2. Selected baby becomes the active profile.
3. Feeding, diaper, and measurement entries automatically use the active baby.
4. History displays events belonging to the active baby.
5. Users may clear the active baby selection at any time.

## Benefits

- Simplifies data entry.
- Improves usability.
- Reduces accidental entry of data under the wrong baby profile.
- Provides a consistent experience across all screens.