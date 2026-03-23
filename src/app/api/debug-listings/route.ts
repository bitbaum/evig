import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, string> = {};
  
  // Test each import from the listings route one by one
  try { await import('@/lib/api/middleware'); results['middleware'] = 'ok'; } catch (e: unknown) { results['middleware'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/api/helpers'); results['helpers'] = 'ok'; } catch (e: unknown) { results['helpers'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/db'); results['db'] = 'ok'; } catch (e: unknown) { results['db'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/db/schema'); results['schema'] = 'ok'; } catch (e: unknown) { results['schema'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/schemas'); results['schemas'] = 'ok'; } catch (e: unknown) { results['schemas'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/config/marketplace'); results['config-marketplace'] = 'ok'; } catch (e: unknown) { results['config-marketplace'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/marketplace/listing-helpers'); results['listing-helpers'] = 'ok'; } catch (e: unknown) { results['listing-helpers'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/email'); results['email'] = 'ok'; } catch (e: unknown) { results['email'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/email/templates/marketplace'); results['email-templates'] = 'ok'; } catch (e: unknown) { results['email-templates'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/security/rate-limit'); results['rate-limit'] = 'ok'; } catch (e: unknown) { results['rate-limit'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/security/sanitize'); results['sanitize'] = 'ok'; } catch (e: unknown) { results['sanitize'] = String(e instanceof Error ? e.message : e); }
  try { await import('@/lib/logger'); results['logger'] = 'ok'; } catch (e: unknown) { results['logger'] = String(e instanceof Error ? e.message : e); }
  
  const failed = Object.entries(results).filter(([, v]) => v !== 'ok');
  return NextResponse.json({ ok: failed.length === 0, results, failed });
}
