// Vercel serverless function: GET /api/kev
// Returns the newest entries in CISA's Known Exploited Vulnerabilities (KEV) catalog.
// Cached at the edge for an hour so the site never hammers CISA.
const FEED = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(FEED, { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'portfolio-kev-ticker/1.0' } });
    clearTimeout(timer);
    if (!r.ok) throw new Error('upstream ' + r.status);
    const data = await r.json();
    const items = (data.vulnerabilities || [])
      .slice()
      .sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
      .slice(0, 15)
      .map(v => ({
        id: v.cveID,
        vendor: v.vendorProject,
        product: v.product,
        name: v.vulnerabilityName,
        added: v.dateAdded,
        ransomware: v.knownRansomwareCampaignUse === 'Known'
      }));
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ updated: data.dateReleased, count: data.count, items });
  } catch (err) {
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(502).json({ error: 'KEV feed unavailable' });
  }
};
