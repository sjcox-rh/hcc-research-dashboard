import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubGlobal(
  'fetch',
  vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (String(name).toLowerCase() === 'x-hcc-jira-proxy' ? 'search-jql' : null),
      },
      json: async () => ({
        jql: 'project = CPUX AND component = "HCC" AND issuetype in (Epic, Story) AND text ~ "research"',
        total: 0,
        startAt: 0,
        maxResults: 100,
        jiraBrowseBase: 'https://redhat.atlassian.net/browse',
        jiraProjectUrl: 'https://redhat.atlassian.net/browse/CPUX',
        issues: [],
      }),
    } as Response),
  ),
);

// Mock CSS imports
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: ResizeObserverCallback) {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
} as any;
