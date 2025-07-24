// sdk/uploadCsvFile.ts
import type { ReadStream } from 'fs';
import { createReadStream } from 'fs';
import { Buffer } from 'buffer';

export type Uploadable =
  | File // browser
  | Blob // browser & Node 20+
  | Buffer // Node
  | ReadStream // Node
  | string; // file path in Node

export interface UploadCsvOptions {
  projectId: string;
  datasourceId: string;
  file: Uploadable;
  accessToken: string;
  baseUrl?: string;
}

export async function uploadCsvFile({
  projectId,
  datasourceId,
  file,
  accessToken,
  baseUrl = 'http://localhost:8000',
}: UploadCsvOptions): Promise<{
  datasource_id: string;
  message: string;
  redirect_to: string;
  success: boolean;
}> {
  // 1. Decide once, at the top of the module
  const isNode = typeof process !== 'undefined' && !!process.versions?.node;

  // In Node we *always* stream with `form-data`
  const FormDataCtor = isNode ? (await import('form-data')).default : FormData;

  // If we’re in Node, we also pick a transport that speaks `form-data`
  const fetchFn: typeof fetch = isNode
    ? ((await import('node-fetch')).default as unknown as typeof fetch)
    : fetch; // browser, Workers, Deno, Bun …

  // The polyfill does not have the same constructor signature as browser FormData,
  // but both can be called with no arguments for our use case.
  const form = new FormDataCtor();

  /* -------------------------------------------------------------- */
  /* 2. Add the CSV under the field name "file"                     */
  /* -------------------------------------------------------------- */
  const appendFile = (bloblike: any, filename: string) =>
    // @ts-ignore – both implementations share this signature
    form.append('file', bloblike, filename);

  if (typeof file === 'string') {
    // path on disk → stream
    const stream = createReadStream(file);
    appendFile(stream, file.split(/[/\\]/).pop() || 'upload.csv');
  } else if (
    (typeof Blob !== 'undefined' && file instanceof Blob) ||
    (typeof File !== 'undefined' && file instanceof File)
  ) {
    appendFile(file, (file as File).name ?? 'upload.csv');
  } else if (file instanceof Buffer) {
    appendFile(file, 'upload.csv');
  } else {
    // ReadStream (already a stream)
    appendFile(file as ReadStream, 'upload.csv');
  }

  /* -------------------------------------------------------------- */
  /* 3. Compose headers                                             */
  /* -------------------------------------------------------------- */
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  // The polyfill exposes multipart headers (boundary etc.)
  if (isNode && typeof (form as any).getHeaders === 'function') {
    Object.assign(headers, (form as any).getHeaders());
  }

  /* -------------------------------------------------------------- */
  /* 4. Fire the request                                            */
  /* -------------------------------------------------------------- */
  const url = `${baseUrl}/v1/actions/load/${projectId}?datasource_id=${datasourceId}`;

  const resp = await fetchFn(url, {
    method: 'POST',
    headers,
    // `form` may be the WHATWG FormData or the polyfill instance;
    // both work as `body`.
    body: form as any,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `Upload failed: ${resp.status} ${resp.statusText}\n${text}`,
    );
  }

  return resp.json(); // endpoint returns JSON
}
