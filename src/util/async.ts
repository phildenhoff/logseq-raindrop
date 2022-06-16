export const applyAsyncFunc = async <Item, AppliedItem>(
  items: Item[],
  f: (item: Item) => Promise<AppliedItem>
): Promise<AppliedItem[]> => {
  const applied = items.map(f);
  return await Promise.all(applied);
};


