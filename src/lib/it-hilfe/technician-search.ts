/**
 * The technician directory's free-text search: name, city or description.
 *
 * A name or a town typed with one slip still finds the person ("Zurich" and
 * "Zürcih" find Zürich, "Mülller" finds Müller): each word no visible
 * technician's name or city contains is widened with the ones it could mean
 * (lib/search/corrections). The directory keeps its own order — verified,
 * then rating — so nothing is re-ranked. Descriptions match as typed.
 */
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { repairerProfiles, userProfiles, users } from '@/db/schema';
import { technicianListConditionsForTier } from '@/lib/domain/technician-visibility';
import {
  allCorrections,
  containsPattern,
  createCorrector,
  ilikeAny,
} from '@/lib/search/corrections';

const technicianWords = createCorrector(
  async () => {
    const rows = await db
      .select({ name: users.name, city: repairerProfiles.city })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, repairerProfiles.userId))
      .where(and(...technicianListConditionsForTier('')));
    return rows.flatMap((row) => [row.name, row.city]);
  },
  { name: 'technicians' },
);

export async function technicianSearchCondition(q: string): Promise<SQL> {
  const typed = containsPattern(q);
  const patterns = [
    typed,
    ...allCorrections(await technicianWords.correct(q)).map(containsPattern),
  ];
  return sql`(${ilikeAny(sql`${users.name}`, patterns)} OR ${repairerProfiles.description} ILIKE ${typed} OR ${ilikeAny(sql`${repairerProfiles.city}`, patterns)})`;
}
