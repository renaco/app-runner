import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  createClubRun,
  deleteClubRun,
  getClubRunById,
  getMemberProfileWithStats,
  listClubRuns,
  removeRunRsvp,
  updateClubRun,
  updateMemberProfile,
  upsertRunRsvp,
} from './src/db/queries.ts';
import type { PaceTier, RunPayload, RunScope, TerrainType } from './src/types/club.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_TERRAINS: TerrainType[] = ['road', 'track', 'trail'];
const VALID_PACE_TIERS: PaceTier[] = ['easy', 'steady', 'tempo', 'intervals'];
const VALID_SCOPES: RunScope[] = ['upcoming', 'going', 'mine', 'all'];

function parsePositiveInt(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const num = Number.parseInt(raw, 10);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

function validateRunPayload(
  body: unknown
): { ok: true; data: RunPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request payload.' };
  }

  const input = body as Record<string, unknown>;
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const runDate = typeof input.runDate === 'string' ? input.runDate.trim() : '';
  const startTime = typeof input.startTime === 'string' ? input.startTime.trim() : '';
  const meetingPoint = typeof input.meetingPoint === 'string' ? input.meetingPoint.trim() : '';
  const paceTarget = typeof input.paceTarget === 'string' ? input.paceTarget.trim() : '';
  const paceTier = typeof input.paceTier === 'string' ? input.paceTier.trim() : '';
  const terrain = typeof input.terrain === 'string' ? input.terrain.trim() : '';

  const distanceKm =
    typeof input.distanceKm === 'number'
      ? input.distanceKm
      : typeof input.distanceKm === 'string'
        ? Number.parseFloat(input.distanceKm)
        : Number.NaN;

  let maxRunners: number | null = null;
  if (input.maxRunners !== null && input.maxRunners !== undefined && input.maxRunners !== '') {
    const parsedMax =
      typeof input.maxRunners === 'number'
        ? input.maxRunners
        : Number.parseInt(String(input.maxRunners), 10);
    if (!Number.isInteger(parsedMax) || parsedMax < 2 || parsedMax > 500) {
      return { ok: false, error: 'Max runners must be a whole number between 2 and 500.' };
    }
    maxRunners = parsedMax;
  }

  if (title.length < 3 || title.length > 120) {
    return { ok: false, error: 'Run title must be between 3 and 120 characters.' };
  }
  if (description.length < 5 || description.length > 1000) {
    return { ok: false, error: 'Route notes must be between 5 and 1000 characters.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
    return { ok: false, error: 'Date must use YYYY-MM-DD format.' };
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return { ok: false, error: 'Start time must use HH:MM format.' };
  }
  if (meetingPoint.length < 3 || meetingPoint.length > 200) {
    return { ok: false, error: 'Meeting point must be between 3 and 200 characters.' };
  }
  if (!Number.isFinite(distanceKm) || distanceKm < 1 || distanceKm > 100) {
    return { ok: false, error: 'Distance must be between 1 and 100 km.' };
  }
  if (paceTarget.length < 2 || paceTarget.length > 40) {
    return { ok: false, error: 'Target pace is required (e.g., 5:15 /km).' };
  }
  if (!VALID_PACE_TIERS.includes(paceTier as PaceTier)) {
    return { ok: false, error: 'Select a valid effort level.' };
  }
  if (!VALID_TERRAINS.includes(terrain as TerrainType)) {
    return { ok: false, error: 'Select a valid terrain type.' };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      runDate,
      startTime,
      meetingPoint,
      distanceKm: Math.round(distanceKm * 10) / 10,
      paceTarget,
      paceTier: paceTier as PaceTier,
      terrain: terrain as TerrainType,
      maxRunners,
    },
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const profile = await getMemberProfileWithStats(req.dbUser!.id);
      if (!profile) {
        res.status(404).json({ error: 'Member profile not found.' });
        return;
      }
      res.json(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/me', requireAuth, async (req: AuthRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : '';
    const pacePreference =
      typeof body?.pacePreference === 'string' ? body.pacePreference.trim() : '';

    if (displayName.length < 2 || displayName.length > 60) {
      res.status(400).json({ error: 'Display name must be between 2 and 60 characters.' });
      return;
    }
    if (pacePreference.length < 2 || pacePreference.length > 30) {
      res.status(400).json({ error: 'Preferred pace must be between 2 and 30 characters.' });
      return;
    }

    try {
      const updated = await updateMemberProfile(req.dbUser!.id, {
        displayName,
        pacePreference,
      });
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/runs', requireAuth, async (req: AuthRequest, res) => {
    const scopeParam = typeof req.query.scope === 'string' ? req.query.scope : 'upcoming';
    const scope: RunScope = VALID_SCOPES.includes(scopeParam as RunScope)
      ? (scopeParam as RunScope)
      : 'upcoming';
    const terrain = typeof req.query.terrain === 'string' ? req.query.terrain : undefined;
    const paceTier = typeof req.query.paceTier === 'string' ? req.query.paceTier : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    try {
      const clubRuns = await listClubRuns({
        currentUserId: req.dbUser!.id,
        scope,
        terrain,
        paceTier,
        search,
      });
      res.json({ runs: clubRuns });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch runs.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
    const runId = parsePositiveInt(req.params.id);
    if (!runId) {
      res.status(400).json({ error: 'Invalid run identifier.' });
      return;
    }

    try {
      const run = await getClubRunById(runId, req.dbUser!.id);
      if (!run) {
        res.status(404).json({ error: 'Run not found.' });
        return;
      }
      res.json({ run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch run.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/runs', requireAuth, async (req: AuthRequest, res) => {
    const validation = validateRunPayload(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const created = await createClubRun(req.dbUser!.id, validation.data);
      res.status(201).json({ run: created });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create run.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
    const runId = parsePositiveInt(req.params.id);
    if (!runId) {
      res.status(400).json({ error: 'Invalid run identifier.' });
      return;
    }

    const validation = validateRunPayload(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const result = await updateClubRun(runId, req.dbUser!.id, validation.data);
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Run not found.' });
        return;
      }
      if (result.status === 'forbidden') {
        res.status(403).json({ error: 'Only the host can edit this run.' });
        return;
      }
      res.json({ run: result.run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update run.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
    const runId = parsePositiveInt(req.params.id);
    if (!runId) {
      res.status(400).json({ error: 'Invalid run identifier.' });
      return;
    }

    try {
      const result = await deleteClubRun(runId, req.dbUser!.id);
      if (result === 'not_found') {
        res.status(404).json({ error: 'Run not found.' });
        return;
      }
      if (result === 'forbidden') {
        res.status(403).json({ error: 'Only the host can cancel this run.' });
        return;
      }
      res.json({ deleted: true, id: runId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete run.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/runs/:id/rsvp', requireAuth, async (req: AuthRequest, res) => {
    const runId = parsePositiveInt(req.params.id);
    if (!runId) {
      res.status(400).json({ error: 'Invalid run identifier.' });
      return;
    }

    const rawNote = (req.body as Record<string, unknown>)?.note;
    const note =
      typeof rawNote === 'string' && rawNote.trim().length > 0
        ? rawNote.trim().slice(0, 140)
        : null;

    try {
      const result = await upsertRunRsvp(runId, req.dbUser!.id, note);
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Run not found.' });
        return;
      }
      if (result.status === 'full') {
        res.status(409).json({ error: 'This run has reached its maximum runner capacity.' });
        return;
      }
      res.json({ run: result.run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join run.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/runs/:id/rsvp', requireAuth, async (req: AuthRequest, res) => {
    const runId = parsePositiveInt(req.params.id);
    if (!runId) {
      res.status(400).json({ error: 'Invalid run identifier.' });
      return;
    }

    try {
      const result = await removeRunRsvp(runId, req.dbUser!.id);
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Run not found.' });
        return;
      }
      res.json({ run: result.run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave run.';
      res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Meridian Run Club server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
