

/**
 * Obtain an ArrayBuffer from a given URL by fetching the resource and converting it to an ArrayBuffer.
 * @param {string} url - The URL of the resource to fetch.
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the fetched data as an ArrayBuffer.
 */
export async function obtainArrayBufferFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource from ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}
