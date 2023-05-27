import type { Raindrop } from "@types";

type HttpClientProps = {
  apiUrl: string;
  accessToken: string;
};

export const generateHttpClient = ({
  accessToken,
  apiUrl,
}: HttpClientProps) => {
  const defaultHeaders = new Headers({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });
  return {
    getRaindrop: async (id: Raindrop["id"]) => {
      return fetch(`${apiUrl}/raindrop/${id}`, {
        method: "GET",
        headers: defaultHeaders,
      });
    },

    search: async (query: string, collectionId: string = "0") => {
      return fetch(`${apiUrl}/raindrops/${collectionId}?search=${query}`, {
        method: "GET",
        headers: defaultHeaders,
      });
    },
  };
};
