import type { APIRequestContext } from '@playwright/test'

async function readCsrfCookie(request: APIRequestContext): Promise<string | undefined> {
  const state = await request.storageState()
  return state.cookies.find(c => c.name === '__Host-csrf' || c.name === 'csrf')?.value
}

export async function getApiCsrfToken(request: APIRequestContext): Promise<string> {
  let token = await readCsrfCookie(request)
  if (token) return token

  await request.get('/dashboard')
  token = await readCsrfCookie(request)
  if (!token) throw new Error('CSRF cookie missing — visit a GET page before API POST')
  return token
}

export async function csrfPost(
  request: APIRequestContext,
  path: string,
  data?: unknown,
): Promise<Awaited<ReturnType<APIRequestContext['post']>>> {
  const csrfToken = await getApiCsrfToken(request)
  return request.post(path, {
    data,
    headers: { 'x-csrf-token': csrfToken },
  })
}

export async function csrfPatch(
  request: APIRequestContext,
  path: string,
  data?: unknown,
): Promise<Awaited<ReturnType<APIRequestContext['patch']>>> {
  const csrfToken = await getApiCsrfToken(request)
  return request.patch(path, {
    data,
    headers: { 'x-csrf-token': csrfToken },
  })
}

export async function csrfDelete(
  request: APIRequestContext,
  path: string,
): Promise<Awaited<ReturnType<APIRequestContext['delete']>>> {
  const csrfToken = await getApiCsrfToken(request)
  return request.delete(path, {
    headers: { 'x-csrf-token': csrfToken },
  })
}
