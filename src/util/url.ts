export const extractUrlFromText = (text: string) => {
  const regexp =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/gi;

  if (typeof text !== "string") {
    throw new TypeError(
      `The str argument should be a string, got ${typeof text}`
    );
  }

  if (!text) {
    return undefined;
  }

  let urls = text.match(regexp);
  if (!urls) return undefined;

  return urls;
};
