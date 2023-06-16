export const DATE_FORMAT_W_OUT_SECONDS = "yyyy-MM-dd'T'HH:mm";
export const DATE_FORMAT = `${DATE_FORMAT_W_OUT_SECONDS}:ss`;

/**
 * Returns dates formatted for saving in Logseq's savings. This converts the value
 * to the users current timezone.
 *
 * This is in the format yyyy-MM-dd'T'HH:mm:ss (:ss is optional) — for example,
 * 2021-09-27T12:00:00 or 2021-09-27T12:00:00:00.
 *
 * @param date Input date
 * @returns
 */
export const formatDateForSettings = (date: Date) => {
  // Copy date and remove timezone offset
  const dateWithoutTimezoneOffset = new Date(date);
  const timezoneOffset = date.getTimezoneOffset() / 60;
  dateWithoutTimezoneOffset.setHours(date.getHours() - timezoneOffset);

  return dateWithoutTimezoneOffset.toISOString().slice(0, 19);
};
