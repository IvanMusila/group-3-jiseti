import { http, HttpResponse } from 'msw';

// Seed data with mixed ownership, attachments, and statuses
let seedId = 4;
let reports = [
  {
    id: 3,
    type: 'intervention',
    title: 'Collapsed Bridge',
    description: 'Flooding collapsed the main bridge overnight.',
    location: { lat: -1.285, lng: 36.82 },
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 7,
    attachments: [
      { name: 'bridge.jpg', size: 245678, type: 'image/jpeg', url: '#' },
    ],
    moderationNotes: [],
  },
  {
    id: 2,
    type: 'intervention',
    title: 'Bridge repair',
    description: 'Cracks on the main span',
    location: { lat: -1.29, lng: 36.82 },
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 7,
    attachments: [],
    moderationNotes: [],
  },
  {
    id: 1,
    type: 'red-flag',
    title: 'Procurement fraud',
    description: 'Suspicious tender award',
    location: { lat: -1.3, lng: 36.82 },
    status: 'under-investigation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 9,
    attachments: [],
    moderationNotes: [
      { id: 1, note: 'Reviewing paperwork', status: 'under-investigation', createdAt: new Date().toISOString() },
    ],
  },
];

function paginate(arr, page = 1, limit = 10) {
  const start = (page-1)*limit;
  const items = arr.slice(start, start+limit);
  return { items, page, totalPages: Math.max(1, Math.ceil(arr.length/limit)), totalItems: arr.length };
}

function matchesFilters(report, { status, type, search }) {
  const statusOk = status ? report.status === status : true;
  const typeOk = type ? report.type === type : true;
  const searchOk = search
    ? report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.description?.toLowerCase().includes(search.toLowerCase())
    : true;
  return statusOk && typeOk && searchOk;
}

async function parseBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const payload = formData.get('payload');
    const attachment = formData.get('attachment');
    return {
      body: payload ? JSON.parse(payload) : {},
      attachment: attachment && typeof attachment === 'object'
        ? {
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            url: '#',
          }
        : null,
    };
  }

  const body = await request.json();
  return { body, attachment: null };
}

export const handlers = [
  http.get('/reports', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Number(url.searchParams.get('limit') || 10);
    const status = url.searchParams.get('status') || '';
    const type = url.searchParams.get('type') || '';
    const search = url.searchParams.get('search') || '';

    const filtered = reports.filter((report) => matchesFilters(report, { status, type, search }));

    const sort = url.searchParams.get('sort');
    if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return HttpResponse.json(paginate(filtered, page, limit));
  }),

  http.get('/reports/:id', ({ params }) => {
    const id = Number(params.id);
    const report = reports.find((item) => item.id === id);
    if (!report) {
      return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    return HttpResponse.json(report);
  }),

  http.post('/reports', async ({ request }) => {
    const { body, attachment } = await parseBody(request);
    const newItem = {
      id: seedId++,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 7, // pretend current user
      attachments: attachment ? [attachment] : [],
      moderationNotes: [],
      ...body,
    };
    reports = [newItem, ...reports];
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.put('/reports/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    const { body, attachment } = await parseBody(request);
    const isStatusUpdate = Object.prototype.hasOwnProperty.call(body, 'status');

    if (!isStatusUpdate && reports[idx].status !== 'pending') {
      return HttpResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
    }

    if (attachment) {
      reports[idx].attachments = [attachment, ...(reports[idx].attachments || [])];
    }

    if (body.note) {
      const noteEntry = {
        id: Date.now(),
        note: body.note,
        status: body.status || reports[idx].status,
        createdAt: new Date().toISOString(),
      };
      reports[idx].moderationNotes = [noteEntry, ...(reports[idx].moderationNotes || [])];
    }

    const { note, ...rest } = body;

    reports[idx] = {
      ...reports[idx],
      ...rest,
      updatedAt: new Date().toISOString(),
    };
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
