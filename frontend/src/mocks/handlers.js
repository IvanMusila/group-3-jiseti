import { http, HttpResponse } from 'msw';

let seedId = 3;
let reports = [
  { id: 2, type: 'intervention', title: 'Bridge repair', description: 'Cracks', location: { lat: -1.29, lng: 36.82 }, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 7 },
  { id: 1, type: 'red-flag', title: 'Procurement fraud', description: 'Suspicious tender', location: { lat: -1.30, lng: 36.82 }, status: 'under-investigation', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 9 }
];

function paginate(arr, page=1, limit=10){
  const start = (page-1)*limit;
  const items = arr.slice(start, start+limit);
  return { items, page, totalPages: Math.max(1, Math.ceil(arr.length/limit)), totalItems: arr.length };
}

export const handlers = [
  http.get('/reports', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Number(url.searchParams.get('limit') || 10);
    return HttpResponse.json(paginate(reports, page, limit));
  }),

  http.post('/reports', async ({ request }) => {
    const body = await request.json();
    const newItem = {
      id: seedId++,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 7, // pretend current user
      ...body
    };
    reports = [newItem, ...reports];
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.put('/reports/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    if (reports[idx].status !== 'pending') {
      return HttpResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
    }
    const patch = await request.json();
    reports[idx] = { ...reports[idx], ...patch, updatedAt: new Date().toISOString() };
    return HttpResponse.json(reports[idx]);
  }),

  http.delete('/reports/:id', ({ params }) => {
    const id = Number(params.id);
    const item = reports.find(r => r.id === id);
    if (!item) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    if (item.status !== 'pending') {
      return HttpResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
    }
    reports = reports.filter(r => r.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];