/**
 * Applies an async function to an array of items, returning a promise
 * that resolves when all items have been processed.
 *
 * @param items Input items to apply `asyncFunction` to
 * @param asyncFunction Async function to apply to `items`
 *
 * @returns Result of applying `asyncFunction` to `items`
 */
export const applyAsyncFunc = async <InputType, OutputType>(
  items: InputType[],
  asyncFunction: (item: InputType) => Promise<OutputType>
): Promise<OutputType[]> => {
  const applied = items.map(asyncFunction);
  return Promise.all(applied);
};
