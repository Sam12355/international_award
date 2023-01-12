import { Router } from 'express';
import * as publishController from './publish.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', publishController.index);
router.post('/:id', publishController.publish);

export default router;
