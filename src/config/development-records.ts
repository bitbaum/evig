/**
 * Building-in-public records — where evig's public roadmap and changelog come from.
 *
 * The record itself lives in this repository as `ROADMAP.md` and `CHANGELOG.md`.
 * Loki's fleet map ingests both, and the site renders them FROM THE MAP — the
 * repo is the source, the map is the producer, the page is a consumer. There is
 * deliberately no local fallback copy: a page that reads its own JSON when the
 * map is down drifts from the map the moment someone edits one and not the other.
 */

/** The fleet map every product renders its development records from. */
export const FLEET_MAP_URL = 'https://loki.orangecat.ch/api/fleet/map';

/** evig's slug in the fleet map. */
export const FLEET_MAP_SLUG = 'evig';

/** The project's page in the fleet directory — where the record is edited and discussed. */
export const FLEET_PROFILE_URL = `https://loki.orangecat.ch/fleet/${FLEET_MAP_SLUG}`;

/** The map is cached five minutes upstream; asking more often returns the same bytes. */
export const FLEET_MAP_REVALIDATE_SECONDS = 300;

/** A slow map must not hold the page: the reader gets "temporarily unavailable" instead. */
export const FLEET_MAP_TIMEOUT_MS = 8_000;
