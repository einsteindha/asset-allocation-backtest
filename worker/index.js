const ALLOWED_HOSTS = [
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
  'ecos.bok.or.kr',
];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('url');
    if (!target) return json({ error: 'missing url param' }, 400);

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (e) {
      return json({ error: 'invalid url' }, 400);
    }

    if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
      return json({ error: 'host not allowed' }, 403);
    }

    try {
      const upstream = await fetch(targetUrl.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...corsHeaders(),
          'Content-Type': upstream.headers.get('content-type') || 'application/json',
        },
      });
    } catch (e) {
      return json({ error: 'upstream fetch failed', detail: String(e) }, 502);
    }
  },
};
