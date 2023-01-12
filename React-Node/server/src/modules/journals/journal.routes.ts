import { Router } from 'express';
import * as journalController from './journal.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/', journalController.index);

export default router;
