import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import prisma from '../../config/database';
import { config } from '../../config';
import { toJournalResource } from './journal.resource';

const cache = new NodeCache({ stdTTL: config.journal.journalCacheTtl });
const CACHE_KEY = 'active_journals';

export async function index(_req: Request, res: Response, next: NextFunction) {
  try {
    // Check cache first
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      res.json({ data: cached });
      return;
    }

    const journals = await prisma.journal.findMany({
      where: { isActive: true },
      select: { id: true, name: true, issn: true },
      orderBy: { name: 'asc' },
    });

    const data = journals.map(toJournalResource);
    cache.set(CACHE_KEY, data);

    res.json({ data });
  } catch (error) {
    next(error);
  }
}
