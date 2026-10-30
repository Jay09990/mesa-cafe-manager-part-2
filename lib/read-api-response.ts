export type ApiResponse<T> = { success: true; data: T; errormsg: null } | { success: false; data: null; errormsg: string };

export async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(body);
  } catch {
    const status = response.status ? ` (HTTP ${response.status})` : "";
    throw new Error(body.trim() ? `The server returned an unexpected response${status}. Please try again.` : `The server returned an empty response${status}. Please try again.`);
  }
  if (!result || typeof result !== "object" || !("success" in result)) {
    throw new Error(`The server returned an unexpected response (HTTP ${response.status}). Please try again.`);
  }
  return result as ApiResponse<T>;
}
