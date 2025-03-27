import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subMonths,
  subYears,
} from 'date-fns';

export function getDateRangeByPeriod(period: string) {
  const now = new Date();
  switch (period) {
    case 'day':
      return { from: startOfDay(now), to: now };
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now }; // 월요일 시작
    case 'month':
      return { from: startOfMonth(now), to: now };
    case '6months':
      return { from: subMonths(now, 6), to: now };
    case 'year':
      return { from: subYears(now, 1), to: now };
    default:
      return null;
  }
}
