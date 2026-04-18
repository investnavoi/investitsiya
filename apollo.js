// ═══ Apollo.io API — BARCHA ENDPOINTLAR ═══
// Docs: https://docs.apollo.io/reference

const BASE = 'https://api.apollo.io/api/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const apiKey = body.api_key || req.query.api_key || process.env.APOLLO_KEY || '';
    const action = body.action || req.query.action || 'people_search';

    if (!apiKey) return res.json({ error: 'api_key kerak' });

    // ═══ ENDPOINT MAP ═══
    const endpoints = {
      // ENRICHMENT
      people_enrichment:      { method: 'POST', url: '/people/match' },
      bulk_people_enrichment: { method: 'POST', url: '/people/bulk_match' },
      org_enrichment:         { method: 'GET',  url: '/organizations/enrich' },
      bulk_org_enrichment:    { method: 'POST', url: '/organizations/bulk_enrich' },

      // SEARCH
      people_search:          { method: 'POST', url: '/mixed_people/search' },
      organization_search:    { method: 'POST', url: '/mixed_companies/search' },
      org_job_postings:       { method: 'GET',  url: '/organizations/{org_id}/job_postings' },
      org_complete_info:      { method: 'GET',  url: '/organizations/{org_id}' },
      news_search:            { method: 'POST', url: '/news/search' },

      // ACCOUNTS (CRM)
      create_account:         { method: 'POST',  url: '/accounts' },
      update_account:         { method: 'PATCH', url: '/accounts/{id}' },
      bulk_create_accounts:   { method: 'POST',  url: '/accounts/bulk_create' },
      bulk_update_accounts:   { method: 'POST',  url: '/accounts/bulk_update' },
      search_accounts:        { method: 'POST',  url: '/accounts/search' },
      view_account:           { method: 'GET',   url: '/accounts/{id}' },
      update_account_stage:   { method: 'POST',  url: '/accounts/bulk_update_stages' },
      update_account_owner:   { method: 'POST',  url: '/accounts/bulk_update_owners' },
      list_account_stages:    { method: 'GET',   url: '/account_stages' },

      // CONTACTS
      create_contact:         { method: 'POST',  url: '/contacts' },
      update_contact:         { method: 'PATCH', url: '/contacts/{id}' },
      bulk_create_contacts:   { method: 'POST',  url: '/contacts/bulk_create' },
      bulk_update_contacts:   { method: 'POST',  url: '/contacts/bulk_update' },
      search_contacts:        { method: 'POST',  url: '/contacts/search' },
      view_contact:           { method: 'GET',   url: '/contacts/{id}' },
      update_contact_stage:   { method: 'POST',  url: '/contacts/bulk_update_stages' },
      update_contact_owner:   { method: 'POST',  url: '/contacts/bulk_update_owners' },
      list_contact_stages:    { method: 'GET',   url: '/contact_stages' },

      // DEALS
      create_deal:            { method: 'POST',  url: '/deals' },
      list_deals:             { method: 'GET',   url: '/deals' },
      view_deal:              { method: 'GET',   url: '/deals/{id}' },
      update_deal:            { method: 'PATCH', url: '/deals/{id}' },
      list_deal_stages:       { method: 'GET',   url: '/deal_stages' },

      // SEQUENCES
      search_sequences:       { method: 'POST', url: '/emailer_campaigns/search' },
      add_to_sequence:        { method: 'POST', url: '/emailer_campaigns/{id}/add_contact_ids' },
      update_sequence_status: { method: 'POST', url: '/emailer_campaigns/{id}/update_contact_statuses' },
      search_emails:          { method: 'GET',  url: '/emailer_messages' },
      email_stats:            { method: 'GET',  url: '/emailer_campaigns/{id}/stats' },

      // TASKS
      create_task:            { method: 'POST', url: '/tasks' },
      search_tasks:           { method: 'POST', url: '/tasks/search' },

      // CALLS
      create_call:            { method: 'POST', url: '/phone_calls' },
      search_calls:           { method: 'GET',  url: '/phone_calls' },
      update_call:            { method: 'PUT',  url: '/phone_calls/{id}' },

      // MISCELLANEOUS
      api_usage:              { method: 'POST', url: '/usage' },
      list_users:             { method: 'GET',  url: '/users' },
      list_email_accounts:    { method: 'GET',  url: '/email_accounts' },
      list_lists:             { method: 'GET',  url: '/labels' },
      list_custom_fields:     { method: 'GET',  url: '/typed_custom_fields' },
      list_fields:            { method: 'GET',  url: '/fields' },
      create_custom_field:    { method: 'POST', url: '/typed_custom_fields' },
    };

    const ep = endpoints[action];
    if (!ep) return res.json({ error: 'Noma\'lum action: ' + action, available: Object.keys(endpoints) });

    // URL'dagi {id}, {org_id} ni almashtirish
    let url = BASE + ep.url;
    if (body.id) url = url.replace('{id}', body.id);
    if (body.org_id) url = url.replace('{org_id}', body.org_id);

    // Query params (GET uchun)
    const params = { ...body };
    delete params.action;
    delete params.api_key;
    delete params.id;
    delete params.org_id;

    // GET so'rovlari uchun query string
    if (ep.method === 'GET') {
      const qs = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null) qs.append(k, params[k]);
      });
      const qstr = qs.toString();
      if (qstr) url += '?' + qstr;
    }

    // API chaqirish
    const fetchOpts = {
      method: ep.method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': apiKey,
        'accept': 'application/json'
      }
    };

    // POST/PATCH/PUT uchun body
    if (['POST', 'PATCH', 'PUT'].includes(ep.method)) {
      fetchOpts.body = JSON.stringify({ ...params, api_key: apiKey });
    }

    const resp = await fetch(url, fetchOpts);
    const data = await resp.json();
    
    res.json({ ...data, _action: action, _status: resp.status });

  } catch (e) {
    res.json({ error: e.message });
  }
}
