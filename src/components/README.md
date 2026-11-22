# Active Baby Selection

## Overview

The Active Baby feature allows the application to maintain a single selected baby profile across all screens. Instead of requiring users to select a baby each time they record information, the active baby is shared throughout the application using React Context.

## Purpose

The active baby system provides a central source of truth for the currently selected profile. This allows feeding events, diaper events, measurements, history records, and future features to automatically associate data with the correct baby.

## Components

### ActiveBabyProvider

The ActiveBabyProvider stores the current active baby in application state and makes that information available to all child components.

### useActiveBaby Hook

The useActiveBaby custom hook provides access to:

- activeBaby
- setActiveBaby

This hook ensures screens can read and update the current baby selection without passing identifiers through multiple component levels.

## Current Usage

The active baby functionality is used by:

- HomeScreen
- BabyProfileScreen
- ManualFeedingScreen
- ManualDiaperScreen
- HistoryScreen

## Workflow

1. User selects a baby profile.
2. Selected baby becomes the active baby.
3. The active baby is shared throughout the application.
4. New events are automatically linked to the selected baby.
5. Users may clear the active baby selection at any time.

## Benefits

- Simplifies data entry.
- Reduces accidental data entry for the wrong baby.
- Creates a consistent user experience across the application.
- Centralizes baby profile selection logic.