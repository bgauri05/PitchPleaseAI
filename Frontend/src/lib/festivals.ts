/**
 * Shared festival data
 * --------------------
 * WHAT: Previously this list lived only inside FestivalIdeas.tsx, hardcoded
 *       with a `daysLeft` number baked in at write-time (e.g. "27 days
 *       left") — which is wrong the moment a day passes. Pulled out here so
 *       (a) it's computed live from real dates instead of going stale, and
 *       (b) the Weekly Planner can reuse the same data to auto-suggest a
 *       festival when planning a week that one falls in.
 */

export interface Festival {
  name: string;
  /** ISO date string, e.g. "2026-11-01" — parseable, unlike a display string. */
  date: string;
  emoji: string;
  color: string;
  ideas: string[];
}

export const FESTIVALS: Festival[] = [
  {
    name: 'Holi',
    date: '2026-03-14',
    emoji: '🎨',
    color: 'from-pink-400 to-purple-400',
    ideas: ['Colorful product showcase', 'Festival discount offers', 'Customer celebration stories'],
  },
  {
    name: 'Eid',
    date: '2026-03-31',
    emoji: '🌙',
    color: 'from-emerald-400 to-teal-400',
    ideas: ['Special Eid greetings', 'Gift collection promotion', 'Community celebration posts'],
  },
  {
    name: 'Ram Navami',
    date: '2026-04-06',
    emoji: '🪔',
    color: 'from-orange-400 to-red-400',
    ideas: ['Traditional blessings', 'Festival special offers', 'Cultural content'],
  },
  {
    name: 'Mahavir Jayanti',
    date: '2026-04-08',
    emoji: '🙏',
    color: 'from-yellow-400 to-orange-400',
    ideas: ['Peace & harmony message', 'Spiritual content', 'Community greetings'],
  },
  {
    name: 'Baisakhi',
    date: '2026-04-14',
    emoji: '🌾',
    color: 'from-green-400 to-yellow-400',
    ideas: ['Harvest celebration', 'Punjabi culture showcase', 'Festival greetings'],
  },
  {
    name: 'Raksha Bandhan',
    date: '2026-08-09',
    emoji: '🎀',
    color: 'from-rose-400 to-pink-400',
    ideas: ['Sibling love stories', 'Gift ideas promotion', 'Family bonding content'],
  },
  {
    name: 'Independence Day',
    date: '2026-08-15',
    emoji: '🇮🇳',
    color: 'from-orange-500 via-white to-green-500',
    ideas: ['Patriotic content', 'Made in India showcase', 'National pride posts'],
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2026-08-22',
    emoji: '🐘',
    color: 'from-amber-400 to-orange-400',
    ideas: ['Festival blessings', 'Cultural celebrations', 'Special offers'],
  },
  {
    name: 'Navratri',
    date: '2026-10-03',
    emoji: '💃',
    color: 'from-purple-400 to-pink-400',
    ideas: ['Dandiya nights promotion', 'Traditional wear showcase', '9 days content series'],
  },
  {
    name: 'Dussehra',
    date: '2026-10-12',
    emoji: '🏹',
    color: 'from-red-500 to-orange-500',
    ideas: ['Victory celebrations', 'Good over evil theme', 'Festival discounts'],
  },
  {
    name: 'Diwali',
    date: '2026-11-01',
    emoji: '🪔',
    color: 'from-yellow-500 via-orange-500 to-red-500',
    ideas: ['Festival lighting showcase', 'Gift hampers promotion', 'Prosperity wishes'],
  },
  {
    name: 'Christmas',
    date: '2026-12-25',
    emoji: '🎄',
    color: 'from-red-500 to-green-500',
    ideas: ['Holiday greetings', 'Gift collection', 'Year-end celebrations'],
  },
];

/**
 * Festival dates above are stored pinned to 2026. Rather than let entries
 * quietly go "in the past" and stop being useful the moment that date
 * passes, treat every festival as annually recurring: if its stored date
 * has already happened this year, the *next occurrence* is next year's
 * same month/day. This is what makes `getDaysUntil` and
 * `getFestivalsInRange` correct on any given day, not just while the
 * calendar still happens to be before all the stored 2026 dates.
 */
export function getNextOccurrence(dateStr: string): Date {
  const stored = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let candidate = new Date(today.getFullYear(), stored.getMonth(), stored.getDate());
  if (candidate.getTime() < today.getTime()) {
    candidate = new Date(today.getFullYear() + 1, stored.getMonth(), stored.getDate());
  }
  return candidate;
}

/** Days until this festival's next occurrence (annually recurring). Never negative. */
export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = getNextOccurrence(dateStr);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Festivals whose *next occurrence* falls within [startDate, endDate], inclusive, by calendar day. */
export function getFestivalsInRange(startDate: Date, endDate: Date): Festival[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return FESTIVALS.filter((f) => {
    const next = getNextOccurrence(f.date);
    return next.getTime() >= start.getTime() && next.getTime() <= end.getTime();
  });
}

/** Format a festival's *next occurrence* as "November 1, 2026" for display. */
export function formatFestivalDate(dateStr: string): string {
  const next = getNextOccurrence(dateStr);
  return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
