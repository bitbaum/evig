// Shared types for the admin command palette: search-index payload + result rows.

import type * as React from 'react';

export interface SearchSection {
  id: string;
  label: string;
  path: string;
  description: string;
}

export interface SearchUser {
  id: string;
  name: string;
  email: string;
}

export interface SearchDecision {
  id: string;
  title: string;
  status: string;
}

export interface SearchListing {
  id: string;
  title: string;
  status: string;
}

export interface SearchIndex {
  sections: SearchSection[];
  recentUsers: SearchUser[];
  recentDecisions: SearchDecision[];
  recentListings: SearchListing[];
}

export interface ResultItem {
  key: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  group: string;
}
