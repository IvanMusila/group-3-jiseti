import { http, HttpResponse } from 'msw';

const ADMIN_ROLES = [
  { id: 'ops-team', name: 'Operations Team' },
  { id: 'invest-unit', name: 'Investigations Unit' },
  { id: 'gov-comms', name: 'Gov Comms' },
];

function historyEntry(type, props = {}) {
  return {
    id: Date.now() + Math.random(),
    type,
    createdAt: new Date().toISOString(),
    author: 'Admin Bot',
    ...props,
  };
}

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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    createdBy: 7,
    assignedTo: null,
    attachments: [
      { name: 'bridge.jpg', size: 245678, type: 'image/jpeg', url: '#' },
    ],
    moderationNotes: [],
    history: [historyEntry('created', { status: 'pending', note: 'Citizen submitted report' })],
  },
  {
    id: 2,
    type: 'intervention',
    title: 'Bridge repair',
    description: 'Cracks on the main span',
    location: { lat: -1.29, lng: 36.82 },
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdBy: 7,
    assignedTo: 'ops-team',
    attachments: [],
    moderationNotes: [],
    history: [
      historyEntry('created', { status: 'pending', note: 'Citizen submitted report' }),
      historyEntry('assignment', { note: 'Assigned to Operations Team', assignedTo: 'ops-team' }),
    ],
  },
  {
    id: 1,
    type: 'red-flag',
    title: 'Procurement fraud',
    description: 'Suspicious tender award',
    location: { lat: -1.3, lng: 36.82 },
    status: 'under-investigation',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdBy: 9,
    assignedTo: 'invest-unit',
    attachments: [],
    moderationNotes: [
      { id: 1, note: 'Reviewing paperwork', status: 'under-investigation', createdAt: new Date().toISOString() },
    ],
    history: [
      historyEntry('created', { status: 'pending', note: 'Citizen submitted report' }),
      historyEntry('status', { status: 'under-investigation', note: 'Manual review started' }),
      historyEntry('assignment', { note: 'Assigned to Investigations Unit', assignedTo: 'invest-unit' }),
    ],
  },
];

function paginate(arr, page = 1, limit = 10) {
  const start = (page-1)*limit;
  const items = arr.slice(start, start+limit);
  return { items, page, totalPages: Math.max(1, Math.ceil(arr.length/limit)), totalItems: arr.length };
}

function matchesFilters(report, { status, type, search, assigned, from, to }) {
  const statusOk = status ? report.status === status : true;
  const typeOk = type ? report.type === type : true;
  const searchOk = search
    ? report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.description?.toLowerCase().includes(search.toLowerCase())
    : true;
  const assignedOk = assigned ? report.assignedTo === assigned : true;
  const created = new Date(report.createdAt).getTime();
  const fromOk = from ? created >= new Date(from).getTime() : true;
  const toOk = to ? created <= new Date(to).getTime() : true;
  return statusOk && typeOk && searchOk && assignedOk && fromOk && toOk;
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
    const assigned = url.searchParams.get('assigned') || '';
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';

    const filtered = reports.filter((report) => matchesFilters(report, { status, type, search, assigned, from, to }));

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
      assignedTo: body.assignedTo || null,
      attachments: attachment ? [attachment] : [],
      moderationNotes: [],
      history: [historyEntry('created', { status: 'pending', note: 'Citizen submitted report' })],
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

    const current = reports[idx];

    function transitionAllowed(fromStatus, toStatus) {
      if (fromStatus === toStatus) return true;
      if (fromStatus === 'pending') {
        return ['under-investigation', 'rejected', 'resolved'].includes(toStatus);
      }
      if (fromStatus === 'under-investigation') {
        return ['resolved', 'rejected'].includes(toStatus);
      }
      return false;
    }

    if (isStatusUpdate) {
      if (!transitionAllowed(current.status, body.status)) {
        return HttpResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
      }
      const requiresNote = ['resolved', 'rejected'].includes(body.status);
      if (requiresNote && !body.note) {
        return HttpResponse.json({ error: 'NOTE_REQUIRED' }, { status: 400 });
      }
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
      reports[idx].history = [
        historyEntry('note', { note: body.note, status: body.status || reports[idx].status }),
        ...(reports[idx].history || []),
      ];
    }

    const { note, ...rest } = body;

    if (typeof rest.assignedTo !== 'undefined' && rest.assignedTo !== reports[idx].assignedTo) {
      reports[idx].history = [
        historyEntry('assignment', { assignedTo: rest.assignedTo, note: `Assigned to ${rest.assignedTo || 'unassigned'}` }),
        ...(reports[idx].history || []),
      ];
    }

    const prevStatus = reports[idx].status;

    reports[idx] = {
      ...reports[idx],
      ...rest,
      updatedAt: new Date().toISOString(),
    };

    if (isStatusUpdate && rest.status !== prevStatus) {
      reports[idx].history = [
        historyEntry('status', { from: prevStatus, status: rest.status, note: note }),
        ...(reports[idx].history || []),
      ];
    }
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
