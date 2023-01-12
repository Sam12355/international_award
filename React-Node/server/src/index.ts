import app from './app';
import { config } from './config';
import logger from './utils/logger';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📋 API docs: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
