type RaindropHttpClient = {
  get: (endpointUrl: string) => Promise<Response>;
  post: (endpointUrl: string, body: unknown) => Promise<Response>;
};

type HttpClientProps = {
  apiUrl: string;
  accessToken: string;
};

/**
 * Raindrop HTTP client, used to commune with the great spirits in the sky.
 *
 * Er, Raindrop's API.
 */
export let httpClient: RaindropHttpClient | null = null;

/**
 * Initialize the Raindrop HTTP client. This *must* be executed before any
 * Raindrop API calls can be made.
 *
 * @param props {HttpClientProps} Configuration for the HTTP client.
 */
export const setupHttpClient = ({
  accessToken,
  apiUrl: baseUrl,
}: HttpClientProps) => {
  const defaultHeaders = new Headers({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });

  httpClient = {
    get: async (path) => {
      return fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: defaultHeaders,
      });
    },
    post: async (path, body) => {
      return fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(body),
      });
    },
  };
};
