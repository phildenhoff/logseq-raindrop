/**
 * Converts a number of seconds to milliseconds.
 * @param seconds The number of seconds to convert.
 * @returns The number of milliseconds.
 */
const secondsToMs = (seconds: number) => seconds * 1000;

const formatterOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
} as const;

/**
 * Converts a number of seconds to a date string formatted like `4/27/2023, 2:11 AM`.
 * @param seconds The number of seconds to convert.
 * @returns The date string.
 */
export const formatSecondsAsDateTime = (seconds: number) =>
  Intl.DateTimeFormat(undefined, formatterOptions).format(secondsToMs(seconds));

/**
 * Formats a date as a date string formatted like `4/27/2023, 2:11 AM`.
 * @param date The date to display.
 * @returns A formatted date string.
 */
export const formatDatetime = (date: Date) =>
  Intl.DateTimeFormat(undefined, formatterOptions).format(date);
