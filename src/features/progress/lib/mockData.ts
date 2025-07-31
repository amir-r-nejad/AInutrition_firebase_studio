import { BodyProgressEntry } from '../types';

export const mockProgressData: BodyProgressEntry[] = [
  // January 2025
  {
    id: 'entry_001',
    user_id: 'user_123',
    date: '2025-01-07',
    weight_kg: 75.2,
    bf_percentage: 18.5,
    waist_cm: 85.0,
    notes: 'Starting the year strong! Feeling motivated.',
    created_at: '2025-01-07T08:30:00Z',
    updated_at: '2025-01-07T08:30:00Z',
  },
  {
    id: 'entry_002',
    user_id: 'user_123',
    date: '2025-01-14',
    weight_kg: 74.8,
    bf_percentage: 18.2,
    waist_cm: 84.5,
    notes: 'Good progress this week. Sticking to meal plan.',
    created_at: '2025-01-14T08:30:00Z',
    updated_at: '2025-01-14T08:30:00Z',
  },
  {
    id: 'entry_003',
    user_id: 'user_123',
    date: '2025-01-21',
    weight_kg: 74.5,
    bf_percentage: 17.9,
    waist_cm: 84.0,
    notes: 'Consistent results. Added more cardio.',
    created_at: '2025-01-21T08:30:00Z',
    updated_at: '2025-01-21T08:30:00Z',
  },
  {
    id: 'entry_004',
    user_id: 'user_123',
    date: '2025-01-28',
    weight_kg: 74.1,
    bf_percentage: 17.6,
    waist_cm: 83.5,
    notes: 'Great month overall! Ready for February.',
    created_at: '2025-01-28T08:30:00Z',
    updated_at: '2025-01-28T08:30:00Z',
  },

  // December 2024
  {
    id: 'entry_005',
    user_id: 'user_123',
    date: '2024-12-02',
    weight_kg: 76.8,
    bf_percentage: 19.8,
    waist_cm: 87.0,
    notes: 'Holiday season starting. Need to stay focused.',
    created_at: '2024-12-02T08:30:00Z',
    updated_at: '2024-12-02T08:30:00Z',
  },
  {
    id: 'entry_006',
    user_id: 'user_123',
    date: '2024-12-09',
    weight_kg: 76.5,
    bf_percentage: 19.5,
    waist_cm: 86.5,
    notes: 'Managed to maintain during holiday parties.',
    created_at: '2024-12-09T08:30:00Z',
    updated_at: '2024-12-09T08:30:00Z',
  },
  {
    id: 'entry_007',
    user_id: 'user_123',
    date: '2024-12-16',
    weight_kg: 76.2,
    bf_percentage: 19.2,
    waist_cm: 86.0,
    notes: 'Christmas week - staying disciplined.',
    created_at: '2024-12-16T08:30:00Z',
    updated_at: '2024-12-16T08:30:00Z',
  },
  {
    id: 'entry_008',
    user_id: 'user_123',
    date: '2024-12-23',
    weight_kg: 76.0,
    bf_percentage: 19.0,
    waist_cm: 85.8,
    notes: 'Ended the year on a positive note!',
    created_at: '2024-12-23T08:30:00Z',
    updated_at: '2024-12-23T08:30:00Z',
  },
  {
    id: 'entry_009',
    user_id: 'user_123',
    date: '2024-12-30',
    weight_kg: 75.8,
    bf_percentage: 18.8,
    waist_cm: 85.5,
    notes: 'Ready for 2025 goals.',
    created_at: '2024-12-30T08:30:00Z',
    updated_at: '2024-12-30T08:30:00Z',
  },

  // November 2024
  {
    id: 'entry_010',
    user_id: 'user_123',
    date: '2024-11-04',
    weight_kg: 77.5,
    bf_percentage: 20.5,
    waist_cm: 88.0,
    notes: 'Back on track after vacation.',
    created_at: '2024-11-04T08:30:00Z',
    updated_at: '2024-11-04T08:30:00Z',
  },
  {
    id: 'entry_011',
    user_id: 'user_123',
    date: '2024-11-11',
    weight_kg: 77.2,
    bf_percentage: 20.2,
    waist_cm: 87.5,
    notes: 'Steady progress this week.',
    created_at: '2024-11-11T08:30:00Z',
    updated_at: '2024-11-11T08:30:00Z',
  },
  {
    id: 'entry_012',
    user_id: 'user_123',
    date: '2024-11-18',
    weight_kg: 76.9,
    bf_percentage: 19.9,
    waist_cm: 87.0,
    notes: 'Thanksgiving prep - staying mindful.',
    created_at: '2024-11-18T08:30:00Z',
    updated_at: '2024-11-18T08:30:00Z',
  },
  {
    id: 'entry_013',
    user_id: 'user_123',
    date: '2024-11-25',
    weight_kg: 77.0,
    bf_percentage: 20.0,
    waist_cm: 87.2,
    notes: 'Thanksgiving week - maintained well.',
    created_at: '2024-11-25T08:30:00Z',
    updated_at: '2024-11-25T08:30:00Z',
  },
];

export const getEntriesForMonth = ({
  progress,
  year,
  month,
}: {
  progress: BodyProgressEntry[];
  year: number;
  month: number;
}): BodyProgressEntry[] => {
  return progress.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entryDate.getFullYear() === year && entryDate.getMonth() === month - 1
    );
  });
};

export function getAvailableMonths(progress: BodyProgressEntry[]) {
  const months = new Set<string>();

  progress.forEach((entry) => {
    const date = new Date(entry.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    months.add(monthKey);
  });

  return Array.from(months)
    .sort((a, b) => b.localeCompare(a))
    .map((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1);
      return {
        value: monthKey,
        label: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        year,
        month,
      };
    });
}
