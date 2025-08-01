import { BodyProgressEntry } from '../types';

export function getEntriesForMonth({
  progress,
  year,
  month,
}: {
  progress: BodyProgressEntry[];
  year: number;
  month: number;
}): BodyProgressEntry[] {
  return progress.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entryDate.getFullYear() === year && entryDate.getMonth() === month - 1
    );
  });
}

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
