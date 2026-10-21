
import { getDatabase } from '../database';
import { getEventHistory } from '../history';

jest.mock('../database', () => ({
  getDatabase: jest.fn(),
}));

const mockGetAllAsync = jest.fn();

const sampleEvents = [
  {
    id: 'feeding-2',
    baby_id: 'baby-1',
    event_type: 'feeding',
    timestamp: '2026-10-21T10:00:00.000Z',
    notes: null,
    feeding_type: 'bottle',
    amount: 120,
    unit: 'ml',
    is_approximate: 0,
    diaper_type: null,
  },
  {
    id: 'diaper-1',
    baby_id: 'baby-1',
    event_type: 'diaper',
    timestamp: '2026-10-21T09:00:00.000Z',
    notes: null,
    feeding_type: null,
    amount: null,
    unit: null,
    is_approximate: null,
    diaper_type: 'wet',
  },
];

beforeEach(() => {
  jest.clearAllMocks();

  (getDatabase as jest.Mock).mockResolvedValue({
    getAllAsync: mockGetAllAsync,
  });

  mockGetAllAsync.mockResolvedValue(sampleEvents);
});

describe('getEventHistory', () => {
  test('combines feeding and diaper events', async () => {
    const result = await getEventHistory({
      babyId: 'baby-1',
    });

    expect(result).toEqual(sampleEvents);

    const [sql, params] = mockGetAllAsync.mock.calls[0];

    expect(sql).toContain('UNION ALL');
    expect(sql).toContain('feeding_events');
    expect(sql).toContain('diaper_events');
    expect(params).toEqual(['baby-1', 'baby-1']);
  });

  test('requests newest-first ordering', async () => {
    await getEventHistory({ babyId: 'baby-1' });

    const [sql] = mockGetAllAsync.mock.calls[0];

    expect(sql).toMatch(/ORDER BY timestamp DESC/);
  });

  test('filters feeding events', async () => {
    await getEventHistory({
      babyId: 'baby-1',
      type: 'feeding',
    });

    const [sql, params] = mockGetAllAsync.mock.calls[0];

    expect(sql).toContain('feeding_events');
    expect(sql).not.toContain('diaper_events');
    expect(params).toEqual(['baby-1']);
  });

  test('filters diaper events', async () => {
    await getEventHistory({
      babyId: 'baby-1',
      type: 'diaper',
    });

    const [sql, params] = mockGetAllAsync.mock.calls[0];

    expect(sql).toContain('diaper_events');
    expect(sql).not.toContain('feeding_events');
    expect(params).toEqual(['baby-1']);
  });

  test('applies inclusive date filters', async () => {
    const startDate = '2026-10-20T00:00:00.000Z';
    const endDate = '2026-10-21T23:59:59.999Z';

    await getEventHistory({
      babyId: 'baby-1',
      startDate,
      endDate,
    });

    const [sql, params] = mockGetAllAsync.mock.calls[0];

    expect(sql).toContain('timestamp >= ?');
    expect(sql).toContain('timestamp <= ?');
    expect(params).toEqual([
      'baby-1',
      'baby-1',
      startDate,
      endDate,
    ]);
  });

  test('scopes both event queries to the baby', async () => {
    await getEventHistory({ babyId: 'baby-2' });

    const [sql, params] = mockGetAllAsync.mock.calls[0];

    expect(
      (sql.match(/WHERE baby_id = \?/g) ?? []).length
    ).toBe(2);

    expect(params).toEqual(['baby-2', 'baby-2']);
  });

  test('rejects an empty baby ID', async () => {
    await expect(
      getEventHistory({ babyId: ' ' })
    ).rejects.toThrow('A baby ID is required.');

    expect(getDatabase).not.toHaveBeenCalled();
  });

  test('rejects reversed date ranges', async () => {
    await expect(
      getEventHistory({
        babyId: 'baby-1',
        startDate: '2026-10-22T00:00:00.000Z',
        endDate: '2026-10-21T00:00:00.000Z',
      })
    ).rejects.toThrow('Start date cannot be after end date.');
  });

  test('rejects invalid dates', async () => {
    await expect(
      getEventHistory({
        babyId: 'baby-1',
        startDate: 'not-a-date',
      })
    ).rejects.toThrow('Dates must be valid ISO UTC timestamps.');
  });

  test('returns an empty history when no events exist', async () => {
    mockGetAllAsync.mockResolvedValue([]);

    const result = await getEventHistory({
      babyId: 'baby-1',
    });

    expect(result).toEqual([]);
  });
});
