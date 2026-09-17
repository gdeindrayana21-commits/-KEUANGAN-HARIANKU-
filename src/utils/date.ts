export const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const HARI_MINGGUAN = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

/**
 * Format date object into YYYY-MM-DD local string
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD safely into local midnight Date
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date();
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Format YYYY-MM-DD or ISO string to Indonesian date: "17 September 2026"
 */
export function formatTanggalIndonesia(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';

  let date: Date;
  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      date = parseLocalDate(dateInput);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const month = BULAN_INDONESIA[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date with day name: "Senin, 17 September 2026"
 */
export function formatTanggalLengkap(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
    ? parseLocalDate(dateInput)
    : new Date(dateInput);

  if (isNaN(date.getTime())) return '-';

  const hari = HARI_INDONESIA[date.getDay()];
  return `${hari}, ${formatTanggalIndonesia(date)}`;
}

/**
 * Returns current date in YYYY-MM-DD format (local date)
 */
export function getTodayString(): string {
  return toDateString(new Date());
}

/**
 * Returns current time in HH:mm format (local time)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// -------------------------------------------------------------
// REQUIRED DATE RANGE UTILITIES (Sections 33, 34, 35)
// -------------------------------------------------------------

export function getStartOfDay(dateInput?: Date | string): string {
  const d = dateInput
    ? typeof dateInput === 'string' ? parseLocalDate(dateInput) : new Date(dateInput)
    : new Date();
  return toDateString(d);
}

export function getEndOfDay(dateInput?: Date | string): string {
  return getStartOfDay(dateInput);
}

/**
 * Start of week with Monday as the first day (Section 35)
 */
export function getStartOfWeek(dateInput?: Date | string): string {
  const d = dateInput
    ? typeof dateInput === 'string' ? parseLocalDate(dateInput) : new Date(dateInput)
    : new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return toDateString(monday);
}

/**
 * End of week with Sunday as the last day (Section 35)
 */
export function getEndOfWeek(dateInput?: Date | string): string {
  const startMondayStr = getStartOfWeek(dateInput);
  const monday = parseLocalDate(startMondayStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return toDateString(sunday);
}

export function getStartOfMonth(year: number, monthIndex: number): string {
  const firstDay = new Date(year, monthIndex, 1);
  return toDateString(firstDay);
}

export function getEndOfMonth(year: number, monthIndex: number): string {
  // Day 0 of next month is the last day of current month
  const lastDay = new Date(year, monthIndex + 1, 0);
  return toDateString(lastDay);
}

export function getStartOfYear(year: number): string {
  return `${year}-01-01`;
}

export function getEndOfYear(year: number): string {
  return `${year}-12-31`;
}

export function getCustomDateRange(startDate: string, endDate: string): { start: string; end: string } {
  return { start: startDate, end: endDate };
}

/**
 * Gets the previous period date range for calculating comparison
 */
export function getPreviousPeriodRange(
  period: string,
  customStart?: string,
  customEnd?: string
): { start: string; end: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const str = toDateString(yesterday);
      return { start: str, end: str };
    }

    case 'this_week': {
      const currentStart = parseLocalDate(getStartOfWeek(today));
      const prevMonday = new Date(currentStart);
      prevMonday.setDate(currentStart.getDate() - 7);
      const prevSunday = new Date(prevMonday);
      prevSunday.setDate(prevMonday.getDate() + 6);
      return { start: toDateString(prevMonday), end: toDateString(prevSunday) };
    }

    case 'this_month': {
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthFirstDay = new Date(prevMonthLastDay.getFullYear(), prevMonthLastDay.getMonth(), 1);
      return { start: toDateString(prevMonthFirstDay), end: toDateString(prevMonthLastDay) };
    }

    case 'last_month': {
      // 2 months ago
      const twoMonthsAgoLastDay = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      const twoMonthsAgoFirstDay = new Date(twoMonthsAgoLastDay.getFullYear(), twoMonthsAgoLastDay.getMonth(), 1);
      return { start: toDateString(twoMonthsAgoFirstDay), end: toDateString(twoMonthsAgoLastDay) };
    }

    case 'this_year': {
      const prevYear = now.getFullYear() - 1;
      return { start: `${prevYear}-01-01`, end: `${prevYear}-12-31` };
    }

    case 'custom': {
      if (customStart && customEnd) {
        const s = parseLocalDate(customStart);
        const e = parseLocalDate(customEnd);
        const daysDiff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const prevEnd = new Date(s);
        prevEnd.setDate(s.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevEnd.getDate() - daysDiff + 1);
        return { start: toDateString(prevStart), end: toDateString(prevEnd) };
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Check if a date string (YYYY-MM-DD) falls within the specified filter period
 */
export function isDateInPeriod(
  dateStr: string,
  period: string,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr) return false;
  if (period === 'all') return true;

  const targetDate = parseLocalDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return dateStr === toDateString(today);

    case 'this_week': {
      const start = getStartOfWeek(today);
      const end = getEndOfWeek(today);
      return dateStr >= start && dateStr <= end;
    }

    case 'this_month': {
      const start = getStartOfMonth(now.getFullYear(), now.getMonth());
      const end = getEndOfMonth(now.getFullYear(), now.getMonth());
      return dateStr >= start && dateStr <= end;
    }

    case 'last_month': {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = getStartOfMonth(lastMonthDate.getFullYear(), lastMonthDate.getMonth());
      const end = getEndOfMonth(lastMonthDate.getFullYear(), lastMonthDate.getMonth());
      return dateStr >= start && dateStr <= end;
    }

    case 'this_year': {
      const start = getStartOfYear(now.getFullYear());
      const end = getEndOfYear(now.getFullYear());
      return dateStr >= start && dateStr <= end;
    }

    case 'custom': {
      if (customStart && customEnd) {
        return dateStr >= customStart && dateStr <= customEnd;
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Format YYYY-MM into "September 2026"
 */
export function formatMonthYearIndonesia(monthStr: string): string {
  if (!monthStr) return '-';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = BULAN_INDONESIA[monthIdx] || parts[1];
  return `${monthName} ${year}`;
}

/**
 * Returns number of days remaining until dueDate (can be negative if overdue)
 */
export function getDaysRemaining(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const target = parseLocalDate(dueDateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
