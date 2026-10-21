
import { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createBaby } from '../../services/database/babies';
import { createFeedingEvent } from '../../services/database/feedings';
import { createDiaperEvent } from '../../services/database/diapers';
import { getEventHistory } from '../../services/database/history';
import { getDatabase } from '../../services/database/database';

type TestResult = {
  name: string;
  passed: boolean;
  details?: string;
};

export default function HistoryTestScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  async function runTests() {
    setRunning(true);
    setResults([]);

    const output: TestResult[] = [];
    const prefix = `history-test-${Date.now()}`;
    const baby1 = `${prefix}-baby1`;
    const baby2 = `${prefix}-baby2`;

    function check(
      name: string,
      condition: boolean,
      details?: string
    ) {
      output.push({ name, passed: condition, details });
    }

    let db: Awaited<ReturnType<typeof getDatabase>> | null = null;

    try {
      db = await getDatabase();

      await createBaby({ id: baby1, name: 'Test Baby 1' });
      await createBaby({ id: baby2, name: 'Test Baby 2' });

      await createFeedingEvent({
        id: `${prefix}-feeding1`,
        baby_id: baby1,
        feeding_type: 'bottle',
        amount: 90,
        unit: 'ml',
        timestamp: '2026-10-20T08:00:00.000Z',
      });

      await createDiaperEvent({
        id: `${prefix}-diaper1`,
        baby_id: baby1,
        diaper_type: 'wet',
        timestamp: '2026-10-20T09:00:00.000Z',
      });

      await createFeedingEvent({
        id: `${prefix}-feeding2`,
        baby_id: baby1,
        feeding_type: 'bottle',
        amount: 120,
        unit: 'ml',
        timestamp: '2026-10-20T10:00:00.000Z',
      });

      await createDiaperEvent({
        id: `${prefix}-other-baby`,
        baby_id: baby2,
        diaper_type: 'dirty',
        timestamp: '2026-10-20T11:00:00.000Z',
      });

      const all = await getEventHistory({ babyId: baby1 });

      check(
        'Combined history',
        all.length === 3 &&
          all.filter(e => e.event_type === 'feeding').length === 2 &&
          all.filter(e => e.event_type === 'diaper').length === 1
      );

      check(
        'Newest-first ordering',
        all.length === 3 &&
          all[0].id === `${prefix}-feeding2` &&
          all[1].id === `${prefix}-diaper1` &&
          all[2].id === `${prefix}-feeding1`
      );

      const feedings = await getEventHistory({
        babyId: baby1,
        type: 'feeding',
      });

      check(
        'Feeding filter',
        feedings.length === 2 &&
          feedings.every(e => e.event_type === 'feeding')
      );

      const diapers = await getEventHistory({
        babyId: baby1,
        type: 'diaper',
      });

      check(
        'Diaper filter',
        diapers.length === 1 &&
          diapers[0].event_type === 'diaper'
      );

      const dateFiltered = await getEventHistory({
        babyId: baby1,
        startDate: '2026-10-20T09:00:00.000Z',
        endDate: '2026-10-20T10:00:00.000Z',
      });

      check(
        'Inclusive date filtering',
        dateFiltered.length === 2 &&
          dateFiltered.some(e => e.id === `${prefix}-diaper1`) &&
          dateFiltered.some(e => e.id === `${prefix}-feeding2`)
      );

      const otherBaby = await getEventHistory({
        babyId: baby2,
      });

      check(
        'Baby isolation',
        otherBaby.length === 1 &&
          otherBaby[0].id === `${prefix}-other-baby`
      );

      const empty = await getEventHistory({
        babyId: `${prefix}-nonexistent`,
      });

      check('Empty history', empty.length === 0);

      check(
        'Event-specific fields',
        all[0].amount === 120 &&
          all[0].unit === 'ml' &&
          all[1].diaper_type === 'wet'
      );

      try {
        await getEventHistory({ babyId: '' });
        check('Invalid baby ID', false);
      } catch {
        check('Invalid baby ID', true);
      }

      try {
        await getEventHistory({
          babyId: baby1,
          startDate: '2026-10-21T00:00:00.000Z',
          endDate: '2026-10-20T00:00:00.000Z',
        });
        check('Invalid date range', false);
      } catch {
        check('Invalid date range', true);
      }
    } catch (error) {
      output.push({
        name: 'Database integration',
        passed: false,
        details: String(error),
      });
    } finally {
      if (db) {
        try {
          await db.runAsync(
            'DELETE FROM feeding_events WHERE baby_id IN (?, ?)',
            [baby1, baby2]
          );
          await db.runAsync(
            'DELETE FROM diaper_events WHERE baby_id IN (?, ?)',
            [baby1, baby2]
          );
          await db.runAsync(
            'DELETE FROM babies WHERE id IN (?, ?)',
            [baby1, baby2]
          );
        } catch (error) {
          output.push({
            name: 'Test data cleanup',
            passed: false,
            details: String(error),
          });
        }
      }

      setResults(output);
      setRunning(false);
    }
  }

  const passed = results.filter(r => r.passed).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Event History Integration Tests
      </Text>

      <Button
        title={running ? 'Running...' : 'Run Tests'}
        onPress={runTests}
        disabled={running}
      />

      {results.length > 0 && (
        <Text style={styles.summary}>
          {passed} / {results.length} passed
        </Text>
      )}

      {results.map((result, index) => (
        <View key={index} style={styles.result}>
          <Text>
            {result.passed ? 'PASS' : 'FAIL'} — {result.name}
          </Text>
          {result.details && (
            <Text style={styles.details}>{result.details}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summary: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  result: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  details: {
    fontSize: 12,
    marginTop: 4,
  },
});
