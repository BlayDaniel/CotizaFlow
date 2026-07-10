import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Variables de entorno Supabase no configuradas.');

    const authorization = req.headers.get('Authorization') || '';
    if (!authorization.toLowerCase().startsWith('bearer ')) {
      return jsonResponse({ error: 'Debes iniciar sesión para crear links públicos.' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const quoteId = String(body.quote_id || '').trim();
    const expiresDays = Number(body.expires_days || 30);
    if (!quoteId) return jsonResponse({ error: 'quote_id es requerido.' }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase.rpc('create_quote_public_link', {
      p_quote_id: quoteId,
      p_expires_days: Number.isFinite(expiresDays) ? Math.max(1, Math.min(90, expiresDays)) : 30
    });
    if (error) throw error;

    const siteUrl = String(body.site_url || req.headers.get('origin') || '').replace(/\/$/, '');
    const token = data?.token || data?.public_token;
    const url = token ? `${siteUrl}/public.html?t=${encodeURIComponent(token)}` : null;
    return jsonResponse({ ...data, url });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'No se pudo crear el link público.' }, 400);
  }
});
