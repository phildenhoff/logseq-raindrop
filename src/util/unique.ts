export const KeyError = class extends Error {};

/**
 * @param keyLabel key to check
 * @param arr array to check
 * @returns
 */
const uniqueByKey = <T>(keyLabel: keyof T, arr: T[]): T[] =>
  Array.from(
    arr
      .reduce((acc, item) => {
        if (!acc.has(item[keyLabel])) acc.set(item[keyLabel], item);
        return acc;
      }, new Map() as Map<T[typeof keyLabel], T>)
      .values()
  );

/**
 * Returns a list of `T` objects from `arr` that are unique by the key
 * `keyLabel`. If more than one object in `arr` has the same value for
 * `keyLabel`, the first object is kept.
 * Throws an error if any object in `arr` does not have the proerpty `keyLabel`.
 *
 * @param keyLabel The key to check for uniqueness.
 * @param arr The array of non-unique items.
 * @returns The array of unique items.
 *
 * @throws {KeyError} If `keyLabel` is not a key in all of the objects in `arr`.
 */
export const uniqueBy = <T extends Object>(
  keyLabel: keyof T,
  arr: T[]
): T[] => {
  if (!arr.every((item) => keyLabel in item)) {
    throw new KeyError(
      `All items must have a key with label ${String(keyLabel)}`
    );
  }
  return uniqueByKey(keyLabel, arr);
};

/**
 * Returns a list of `T` objects from `arr` that are unique by the key
 * `keyLabel`. If more than one object in `arr` has the same value for
 * `keyLabel`, the first object is kept.
 *
 * Unlike `uniqueBy`, this function does not throw an error if any object in
 * `arr` does not have the property `keyLabel`.
 *
 * @param keyLabel The key to check for uniqueness.
 * @param arr The array of non-unique items.
 * @returns The array of unique items.
 *
 * @throws {KeyError} If `keyLabel` is not a key in all of the objects in `arr`.
 */
export const relaxedUniqueBy = <T>(keyLabel: keyof T, arr: T[]): T[] =>
  uniqueByKey(keyLabel, arr);
