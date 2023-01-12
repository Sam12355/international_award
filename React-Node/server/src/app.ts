import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import articleRoutes from './modules/articles/article.routes';
import reviewRoutes from './modules/reviews/review.routes';
import publishRoutes from './modules/publish/publish.routes';
import journalRoutes from './modules/journals/journal.routes';
import userRoutes from './modules/users/user.routes';

const app = express();

// ─── Security ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// ─── Body parsing ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate limiting ──────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Static files (uploaded manuscripts) ────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/users', userRoutes);

// ─── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handling ─────────────────────────────────────
app.use(errorHandler);

export default app;
