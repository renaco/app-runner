import { and, asc, eq, gte, inArray } from 'drizzle-orm';
import { db } from './index.ts';
import { runRsvps, runs, users } from './schema.ts';
import type { ClubRun, MemberProfile, PaceTier, RunPayload, RunScope, TerrainType } from '../types/club.ts';

export async function getOrCreateUser(params: {
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
}) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email,
        displayName: params.displayName,
        photoUrl: params.photoUrl,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: params.email,
          ...(params.photoUrl ? { photoUrl: params.photoUrl } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Unable to synchronize member profile. Please try again.', { cause: error });
  }
}

export async function getMemberProfileWithStats(userId: number): Promise<MemberProfile | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const hosted = await db.select({ id: runs.id }).from(runs).where(eq(runs.hostUserId, userId));
    const rsvps = await db
      .select({ id: runRsvps.id })
      .from(runRsvps)
      .where(eq(runRsvps.userId, userId));

    return {
      id: user.id,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
      pacePreference: user.pacePreference,
      hostedCount: hosted.length,
      rsvpCount: rsvps.length,
    };
  } catch (error) {
    console.error('Database query failed in getMemberProfileWithStats:', error);
    throw new Error('Unable to load member profile. Please try again.', { cause: error });
  }
}

export async function updateMemberProfile(
  userId: number,
  updates: { displayName: string; pacePreference: string }
): Promise<MemberProfile | null> {
  try {
    await db
      .update(users)
      .set({
        displayName: updates.displayName,
        pacePreference: updates.pacePreference,
      })
      .where(eq(users.id, userId));

    return await getMemberProfileWithStats(userId);
  } catch (error) {
    console.error('Database query failed in updateMemberProfile:', error);
    throw new Error('Unable to update member profile. Please try again.', { cause: error });
  }
}

export async function listClubRuns(params: {
  currentUserId: number;
  scope?: RunScope;
  terrain?: string;
  paceTier?: string;
  search?: string;
}): Promise<ClubRun[]> {
  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const conditions = [];

    if (!params.scope || params.scope === 'upcoming') {
      conditions.push(gte(runs.runDate, todayIso));
    }
    if (params.scope === 'mine') {
      conditions.push(eq(runs.hostUserId, params.currentUserId));
    }
    if (params.terrain && ['road', 'track', 'trail'].includes(params.terrain)) {
      conditions.push(eq(runs.terrain, params.terrain));
    }
    if (params.paceTier && ['easy', 'steady', 'tempo', 'intervals'].includes(params.paceTier)) {
      conditions.push(eq(runs.paceTier, params.paceTier));
    }

    const baseQuery = db
      .select({
        run: runs,
        host: {
          id: users.id,
          displayName: users.displayName,
          photoUrl: users.photoUrl,
          pacePreference: users.pacePreference,
        },
      })
      .from(runs)
      .innerJoin(users, eq(runs.hostUserId, users.id));

    const rows =
      conditions.length > 0
        ? await baseQuery
            .where(and(...conditions))
            .orderBy(asc(runs.runDate), asc(runs.startTime))
        : await baseQuery.orderBy(asc(runs.runDate), asc(runs.startTime));

    if (rows.length === 0) {
      return [];
    }

    const runIds = rows.map((r) => r.run.id);
    const rsvpRows = await db
      .select({
        runId: runRsvps.runId,
        userId: runRsvps.userId,
        note: runRsvps.note,
        createdAt: runRsvps.createdAt,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
        pacePreference: users.pacePreference,
      })
      .from(runRsvps)
      .innerJoin(users, eq(runRsvps.userId, users.id))
      .where(inArray(runRsvps.runId, runIds))
      .orderBy(asc(runRsvps.createdAt));

    const rsvpsByRun = new Map<number, typeof rsvpRows>();
    for (const rsvp of rsvpRows) {
      const list = rsvpsByRun.get(rsvp.runId) ?? [];
      list.push(rsvp);
      rsvpsByRun.set(rsvp.runId, list);
    }

    const normalizedSearch = params.search?.trim().toLowerCase() ?? '';

    const mapped: ClubRun[] = rows.map(({ run, host }) => {
      const attendees = rsvpsByRun.get(run.id) ?? [];
      const myRsvp = attendees.find((a) => a.userId === params.currentUserId);
      return {
        id: run.id,
        title: run.title,
        description: run.description,
        runDate: run.runDate,
        startTime: run.startTime,
        meetingPoint: run.meetingPoint,
        distanceKm: Number(run.distanceKm),
        paceTarget: run.paceTarget,
        paceTier: run.paceTier as PaceTier,
        terrain: run.terrain as TerrainType,
        maxRunners: run.maxRunners,
        createdAt: run.createdAt.toISOString(),
        host,
        rsvpCount: attendees.length,
        isHost: run.hostUserId === params.currentUserId,
        isGoing: Boolean(myRsvp),
        userNote: myRsvp?.note ?? null,
        attendees: attendees.map((a) => ({
          userId: a.userId,
          displayName: a.displayName,
          photoUrl: a.photoUrl,
          pacePreference: a.pacePreference,
          note: a.note,
          joinedAt: a.createdAt.toISOString(),
        })),
      };
    });

    return mapped.filter((item) => {
      if (params.scope === 'going' && !item.isGoing) {
        return false;
      }
      if (normalizedSearch) {
        const haystack =
          `${item.title} ${item.meetingPoint} ${item.description} ${item.host.displayName} ${item.paceTarget}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      return true;
    });
  } catch (error) {
    console.error('Database query failed in listClubRuns:', error);
    throw new Error('Unable to load upcoming runs. Please try again later.', { cause: error });
  }
}

export async function getClubRunById(runId: number, currentUserId: number): Promise<ClubRun | null> {
  try {
    const rows = await db
      .select({
        run: runs,
        host: {
          id: users.id,
          displayName: users.displayName,
          photoUrl: users.photoUrl,
          pacePreference: users.pacePreference,
        },
      })
      .from(runs)
      .innerJoin(users, eq(runs.hostUserId, users.id))
      .where(eq(runs.id, runId));

    if (rows.length === 0) return null;

    const { run, host } = rows[0];
    const attendees = await db
      .select({
        userId: runRsvps.userId,
        note: runRsvps.note,
        createdAt: runRsvps.createdAt,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
        pacePreference: users.pacePreference,
      })
      .from(runRsvps)
      .innerJoin(users, eq(runRsvps.userId, users.id))
      .where(eq(runRsvps.runId, runId))
      .orderBy(asc(runRsvps.createdAt));

    const myRsvp = attendees.find((a) => a.userId === currentUserId);

    return {
      id: run.id,
      title: run.title,
      description: run.description,
      runDate: run.runDate,
      startTime: run.startTime,
      meetingPoint: run.meetingPoint,
      distanceKm: Number(run.distanceKm),
      paceTarget: run.paceTarget,
      paceTier: run.paceTier as PaceTier,
      terrain: run.terrain as TerrainType,
      maxRunners: run.maxRunners,
      createdAt: run.createdAt.toISOString(),
      host,
      rsvpCount: attendees.length,
      isHost: run.hostUserId === currentUserId,
      isGoing: Boolean(myRsvp),
      userNote: myRsvp?.note ?? null,
      attendees: attendees.map((a) => ({
        userId: a.userId,
        displayName: a.displayName,
        photoUrl: a.photoUrl,
        pacePreference: a.pacePreference,
        note: a.note,
        joinedAt: a.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Database query failed in getClubRunById:', error);
    throw new Error('Unable to load run details. Please try again later.', { cause: error });
  }
}

export async function createClubRun(hostUserId: number, payload: RunPayload): Promise<ClubRun> {
  try {
    const [created] = await db
      .insert(runs)
      .values({
        hostUserId,
        title: payload.title,
        description: payload.description,
        runDate: payload.runDate,
        startTime: payload.startTime,
        meetingPoint: payload.meetingPoint,
        distanceKm: payload.distanceKm,
        paceTarget: payload.paceTarget,
        paceTier: payload.paceTier,
        terrain: payload.terrain,
        maxRunners: payload.maxRunners,
      })
      .returning();

    await db
      .insert(runRsvps)
      .values({
        runId: created.id,
        userId: hostUserId,
        note: 'Run host',
      })
      .onConflictDoNothing();

    const fullRun = await getClubRunById(created.id, hostUserId);
    if (!fullRun) {
      throw new Error('Created run could not be retrieved.');
    }
    return fullRun;
  } catch (error) {
    console.error('Database query failed in createClubRun:', error);
    throw new Error('Unable to post run. Please try again later.', { cause: error });
  }
}

export async function updateClubRun(
  runId: number,
  hostUserId: number,
  payload: RunPayload
): Promise<{ status: 'ok'; run: ClubRun } | { status: 'not_found' } | { status: 'forbidden' }> {
  try {
    const [existing] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!existing) return { status: 'not_found' };
    if (existing.hostUserId !== hostUserId) return { status: 'forbidden' };

    await db
      .update(runs)
      .set({
        title: payload.title,
        description: payload.description,
        runDate: payload.runDate,
        startTime: payload.startTime,
        meetingPoint: payload.meetingPoint,
        distanceKm: payload.distanceKm,
        paceTarget: payload.paceTarget,
        paceTier: payload.paceTier,
        terrain: payload.terrain,
        maxRunners: payload.maxRunners,
      })
      .where(eq(runs.id, runId));

    const updated = await getClubRunById(runId, hostUserId);
    if (!updated) return { status: 'not_found' };
    return { status: 'ok', run: updated };
  } catch (error) {
    console.error('Database query failed in updateClubRun:', error);
    throw new Error('Unable to update run. Please try again later.', { cause: error });
  }
}

export async function deleteClubRun(
  runId: number,
  hostUserId: number
): Promise<'ok' | 'not_found' | 'forbidden'> {
  try {
    const [existing] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!existing) return 'not_found';
    if (existing.hostUserId !== hostUserId) return 'forbidden';

    await db.delete(runs).where(eq(runs.id, runId));
    return 'ok';
  } catch (error) {
    console.error('Database query failed in deleteClubRun:', error);
    throw new Error('Unable to cancel run. Please try again later.', { cause: error });
  }
}

export async function upsertRunRsvp(
  runId: number,
  userId: number,
  note: string | null
): Promise<{ status: 'ok'; run: ClubRun } | { status: 'not_found' } | { status: 'full' }> {
  try {
    const [existingRun] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!existingRun) return { status: 'not_found' };

    const existingRsvps = await db
      .select({ userId: runRsvps.userId })
      .from(runRsvps)
      .where(eq(runRsvps.runId, runId));

    const alreadyJoined = existingRsvps.some((r) => r.userId === userId);
    if (
      !alreadyJoined &&
      existingRun.maxRunners !== null &&
      existingRsvps.length >= existingRun.maxRunners
    ) {
      return { status: 'full' };
    }

    await db
      .insert(runRsvps)
      .values({
        runId,
        userId,
        note,
      })
      .onConflictDoUpdate({
        target: [runRsvps.runId, runRsvps.userId],
        set: { note },
      });

    const updated = await getClubRunById(runId, userId);
    if (!updated) return { status: 'not_found' };
    return { status: 'ok', run: updated };
  } catch (error) {
    console.error('Database query failed in upsertRunRsvp:', error);
    throw new Error('Unable to confirm RSVP. Please try again later.', { cause: error });
  }
}

export async function removeRunRsvp(
  runId: number,
  userId: number
): Promise<{ status: 'ok'; run: ClubRun } | { status: 'not_found' }> {
  try {
    const [existingRun] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!existingRun) return { status: 'not_found' };

    await db
      .delete(runRsvps)
      .where(and(eq(runRsvps.runId, runId), eq(runRsvps.userId, userId)));

    const updated = await getClubRunById(runId, userId);
    if (!updated) return { status: 'not_found' };
    return { status: 'ok', run: updated };
  } catch (error) {
    console.error('Database query failed in removeRunRsvp:', error);
    throw new Error('Unable to withdraw RSVP. Please try again later.', { cause: error });
  }
}
