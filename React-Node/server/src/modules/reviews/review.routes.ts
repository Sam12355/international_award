import { Router } from 'express';
import * as reviewController from './review.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('REVIEWER', 'ADMIN'));

router.get('/', reviewController.index);
router.get('/:id', reviewController.show);
router.patch('/:id/status', reviewController.updateStatus);

export default router;
