type ApiJsonResult<T> = {
  data: T;
  ok: boolean;
  status: number;
};

type PendingRequest = Promise<ApiJsonResult<unknown>>;

const pendingRequests = new Map<string, PendingRequest>();

const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 500;

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function requestOnce<T>(
  url: string,
  timeoutMs: number,
): Promise<ApiJsonResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "default",
      signal: controller.signal,
    });
    const data = (await response.json()) as T;

    return {
      data,
      ok: response.ok,
      status: response.status,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestWithRetry<T>(
  url: string,
  timeoutMs: number,
): Promise<ApiJsonResult<T>> {
  try {
    const firstResult = await requestOnce<T>(url, timeoutMs);

    if (firstResult.status < 500) {
      return firstResult;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn(`${url} timed out; retrying once.`);
    } else {
      console.warn(`${url} failed; retrying once.`, error);
    }
  }

  await delay(RETRY_DELAY_MS);
  return requestOnce<T>(url, timeoutMs);
}

/**
 * Shares identical dashboard GET requests while they are in flight. Several
 * dashboard cards consume the same APIs, so this prevents duplicate cold-start
 * work without changing the refresh schedule or the data returned by an API.
 */
export function fetchDashboardJson<T>(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ApiJsonResult<T>> {
  const existingRequest = pendingRequests.get(url);

  if (existingRequest) {
    return existingRequest as Promise<ApiJsonResult<T>>;
  }

  const request = requestWithRetry<T>(url, timeoutMs).finally(() => {
    pendingRequests.delete(url);
  });

  pendingRequests.set(url, request as PendingRequest);
  return request;
}
