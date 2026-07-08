import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@freeder/readingStatistics';

export type ReadingStatistics = {
  totalReadingSeconds: number;
  booksFinished: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastReadDate?: string;
  sessionsByBook: Record<string, number>;
};

const EMPTY_STATS: ReadingStatistics = {
  totalReadingSeconds: 0,
  booksFinished: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  sessionsByBook: {},
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dateA = new Date(`${a}T00:00:00`).getTime();
  const dateB = new Date(`${b}T00:00:00`).getTime();
  return Math.round((dateB - dateA) / msPerDay);
}

export async function loadReadingStatistics(): Promise<ReadingStatistics> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...EMPTY_STATS };
  }
  try {
    return { ...EMPTY_STATS, ...(JSON.parse(raw) as ReadingStatistics) };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export async function saveReadingStatistics(
  stats: ReadingStatistics,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export async function recordReadingSession(
  bookId: string,
  seconds: number,
): Promise<ReadingStatistics> {
  if (seconds <= 0) {
    return loadReadingStatistics();
  }

  const stats = await loadReadingStatistics();
  const today = todayKey();
  const last = stats.lastReadDate;

  let currentStreak = stats.currentStreakDays;
  if (!last) {
    currentStreak = 1;
  } else if (last === today) {
    currentStreak = Math.max(1, currentStreak);
  } else if (dayDiff(last, today) === 1) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const next: ReadingStatistics = {
    ...stats,
    totalReadingSeconds: stats.totalReadingSeconds + seconds,
    currentStreakDays: currentStreak,
    longestStreakDays: Math.max(stats.longestStreakDays, currentStreak),
    lastReadDate: today,
    sessionsByBook: {
      ...stats.sessionsByBook,
      [bookId]: (stats.sessionsByBook[bookId] ?? 0) + seconds,
    },
  };
  await saveReadingStatistics(next);
  return next;
}

export async function recordBookFinished(): Promise<ReadingStatistics> {
  const stats = await loadReadingStatistics();
  const next = { ...stats, booksFinished: stats.booksFinished + 1 };
  await saveReadingStatistics(next);
  return next;
}

export function formatReadingDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
