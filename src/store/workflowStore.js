// Cross-role event bus (A4.5). Shared foundation for the MP/District/State/
// Ministry workspaces built in Sessions B-E -- this session only ships the
// routing infrastructure (schema, reducer, persistence, inbox counts), not
// the per-role UI that will consume it.
//
// Uses plain React Context + useReducer (the project has no existing global
// state library, and the spec says not to casually introduce one). State is
// hydrated once from public/data/workflow_seed.json (Layer 2 -- prototype
// workflow data, every record carries source: "prototype_workflow") and then
// persisted to localStorage so it survives a refresh.
//
// No JSX here on purpose: the file is named workflowStore.js per spec, and
// plain .js files in this project are not run through the JSX transform.

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const STORAGE_KEY = 'fundiq.workflowStore.v1';
const SEED_URL = '/data/workflow_seed.json';

export const EVENT_TYPES = {
  REQUEST_INFORMATION: 'REQUEST_INFORMATION',
  MARK_FOLLOW_UP: 'MARK_FOLLOW_UP',
  ESCALATE_FOR_REVIEW: 'ESCALATE_FOR_REVIEW',
  SEND_TO_DISTRICT_REVIEW: 'SEND_TO_DISTRICT_REVIEW',
  REQUEST_STATE_REVIEW: 'REQUEST_STATE_REVIEW',
  // District-internal verification/decision case file (Session C). A case
  // is opened once per work via "Assign Verification" and then carries its
  // own status (Verification In Progress / Clarification Pending /
  // Decision Due / Decision Recorded / Escalated) through history entries
  // written by updateEventStatus/appendHistory -- same event bus, no
  // parallel workflow system.
  DISTRICT_CASE: 'DISTRICT_CASE',
  // A district-raised follow-up reminder against a work, distinct from the
  // MP-raised MARK_FOLLOW_UP above (kept separate so the two don't collide
  // in Action Center bucketing).
  DISTRICT_FOLLOW_UP: 'DISTRICT_FOLLOW_UP',
  // An MP-proposed new work (Phase 6.2) -- there is no real eSAKSHI workId
  // for this yet, so it carries its own structured `payload` (category,
  // description, estimatedCost, locality, coordinates) instead. Always
  // created with source: 'prototype_workflow' regardless of how it's
  // triggered, since the underlying "work" itself is entirely synthetic,
  // not just the workflow status around a real one.
  RECOMMEND_NEW_WORK: 'RECOMMEND_NEW_WORK',
};

// Allowed fromRole -> toRole routes for each event type (A4.5).
export const EVENT_ROUTES = {
  [EVENT_TYPES.REQUEST_INFORMATION]: { fromRole: 'mp', toRole: 'district' },
  [EVENT_TYPES.MARK_FOLLOW_UP]: { fromRole: 'mp', toRole: 'district' },
  [EVENT_TYPES.ESCALATE_FOR_REVIEW]: { fromRole: 'district', toRole: 'state' },
  [EVENT_TYPES.SEND_TO_DISTRICT_REVIEW]: { fromRole: 'state', toRole: 'district' },
  [EVENT_TYPES.REQUEST_STATE_REVIEW]: { fromRole: 'ministry', toRole: 'state' },
  [EVENT_TYPES.DISTRICT_CASE]: { fromRole: 'district', toRole: 'district' },
  [EVENT_TYPES.DISTRICT_FOLLOW_UP]: { fromRole: 'district', toRole: 'district' },
  [EVENT_TYPES.RECOMMEND_NEW_WORK]: { fromRole: 'mp', toRole: 'district' },
};

let eventCounter = 0;
function nextId(prefix) {
  eventCounter += 1;
  return `${prefix}${Date.now().toString(36)}${eventCounter.toString(36)}`;
}

function makeHistoryEntry(action, actorRole, note) {
  return {
    action,
    actorRole,
    note: note || null,
    timestamp: new Date().toISOString(),
  };
}

const initialState = {
  hydrated: false,
  hydratedFrom: null, // 'localStorage' | 'seed'
  events: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };

    case 'CREATE_EVENT': {
      const { eventType, fromRole, toRole, workId, reason, priority, dueDate, source, status, payload: extraPayload } = action.payload;
      const route = EVENT_ROUTES[eventType];
      const event = {
        id: nextId('EVT'),
        type: eventType,
        fromRole: fromRole || route?.fromRole,
        toRole: toRole || route?.toRole,
        workId,
        reason: reason || '',
        priority: priority || 'normal',
        dueDate: dueDate || null,
        status: status || 'Open',
        source: source || 'session_a_live',
        // Structured extra data for event types with no real eSAKSHI workId
        // to hang fields off of (e.g. RECOMMEND_NEW_WORK). null for every
        // other event type -- existing consumers that only read
        // id/type/fromRole/toRole/workId/reason/etc. are unaffected.
        payload: extraPayload || null,
        createdAt: new Date().toISOString(),
        history: [makeHistoryEntry('Created', fromRole || route?.fromRole, reason)],
      };
      return { ...state, events: [event, ...state.events] };
    }

    case 'UPDATE_EVENT_STATUS': {
      const { id, status, actorRole, note } = action.payload;
      return {
        ...state,
        events: state.events.map((evt) => (
          evt.id === id
            ? {
              ...evt,
              status,
              history: [...evt.history, makeHistoryEntry(`Status -> ${status}`, actorRole, note)],
            }
            : evt
        )),
      };
    }

    case 'APPEND_HISTORY': {
      const { id, action: histAction, actorRole, note } = action.payload;
      return {
        ...state,
        events: state.events.map((evt) => (
          evt.id === id
            ? { ...evt, history: [...evt.history, makeHistoryEntry(histAction, actorRole, note)] }
            : evt
        )),
      };
    }

    default:
      return state;
  }
}

// Layer 2 prototype seed records don't ship in the new fromRole/toRole event
// shape (they predate A4.5's schema) -- derive a small, honestly-labelled
// starter set of cross-role events from them so the inbox isn't empty on
// first load, while keeping every derived event tagged
// source: "prototype_workflow" and traceable back to its seed record id.
function deriveEventsFromSeed(seed) {
  const events = [];

  (seed.clarificationRequests || []).filter((c) => c.status === 'Open').forEach((c) => {
    events.push({
      id: `SEED_${c.id}`,
      type: EVENT_TYPES.REQUEST_INFORMATION,
      fromRole: 'district',
      toRole: 'mp',
      workId: c.workId,
      reason: c.question,
      priority: 'normal',
      dueDate: null,
      status: 'Open',
      source: 'prototype_workflow',
      createdAt: c.requestedAt,
      history: [makeHistoryEntry('Created (seeded)', 'district', c.question)],
    });
  });

  (seed.followUps || []).forEach((f) => {
    events.push({
      id: `SEED_${f.id}`,
      type: EVENT_TYPES.MARK_FOLLOW_UP,
      fromRole: 'mp',
      toRole: 'district',
      workId: f.workId,
      reason: f.note,
      priority: 'normal',
      dueDate: f.dueDate || null,
      status: f.status === 'Open' ? 'Open' : 'Resolved',
      source: 'prototype_workflow',
      createdAt: f.dueDate || null,
      history: [makeHistoryEntry('Created (seeded)', 'mp', f.note)],
    });
  });

  (seed.verificationTasks || []).filter((v) => v.status === 'Escalated').forEach((v) => {
    events.push({
      id: `SEED_${v.id}`,
      type: EVENT_TYPES.ESCALATE_FOR_REVIEW,
      fromRole: 'district',
      toRole: 'state',
      workId: v.workId,
      reason: `Verification task ${v.id} escalated for ${v.assignedRole || 'state'} review.`,
      priority: 'high',
      dueDate: null,
      status: 'Open',
      source: 'prototype_workflow',
      createdAt: v.createdAt,
      history: [makeHistoryEntry('Created (seeded)', 'district', null)],
    });
  });

  return events;
}

function loadPersisted() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.events)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: state.events }));
  } catch {
    // ignore persistence failures (private mode / quota)
  }
}

const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const persisted = loadPersisted();
      if (persisted) {
        if (!cancelled) {
          dispatch({ type: 'HYDRATE', payload: { events: persisted.events, hydratedFrom: 'localStorage' } });
        }
        return;
      }
      try {
        const res = await fetch(SEED_URL);
        const seed = res.ok ? await res.json() : null;
        const events = seed ? deriveEventsFromSeed(seed) : [];
        if (!cancelled) {
          dispatch({ type: 'HYDRATE', payload: { events, hydratedFrom: 'seed' } });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: 'HYDRATE', payload: { events: [], hydratedFrom: 'seed' } });
        }
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state.hydrated) persist(state);
  }, [state]);

  const api = useMemo(() => ({
    events: state.events,
    hydrated: state.hydrated,

    createEvent: (eventType, { fromRole, toRole, workId, reason, priority, dueDate, status, source, payload } = {}) => {
      dispatch({ type: 'CREATE_EVENT', payload: { eventType, fromRole, toRole, workId, reason, priority, dueDate, status, source, payload } });
    },

    updateEventStatus: (id, status, actorRole, note) => {
      dispatch({ type: 'UPDATE_EVENT_STATUS', payload: { id, status, actorRole, note } });
    },

    appendHistory: (id, historyAction, actorRole, note) => {
      dispatch({ type: 'APPEND_HISTORY', payload: { id, action: historyAction, actorRole, note } });
    },

    getInboxForRole: (role) => state.events.filter((e) => e.toRole === role && e.status === 'Open'),
    getSentByRole: (role) => state.events.filter((e) => e.fromRole === role),
    getInboxCount: (role) => state.events.filter((e) => e.toRole === role && e.status === 'Open').length,
    getEventsForWork: (workId) => state.events.filter((e) => e.workId === workId),
    getCaseForWork: (workId) => state.events.find((e) => e.workId === workId && e.type === EVENT_TYPES.DISTRICT_CASE) || null,
    getFollowUpsForWork: (workId) => state.events.filter((e) => e.workId === workId && e.type === EVENT_TYPES.DISTRICT_FOLLOW_UP),
  }), [state]);

  return React.createElement(WorkflowContext.Provider, { value: api }, children);
}

export function useWorkflowStore() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error('useWorkflowStore must be used within a WorkflowProvider');
  }
  return ctx;
}
