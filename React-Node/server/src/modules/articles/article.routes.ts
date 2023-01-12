import { Router } from 'express';
import * as articleController from './article.controller';
import { authenticate } from '../../middleware/authenticate';
import { uploadManuscript } from '../../services/storage.service';

const router = Router();

// All article routes require authentication
router.use(authenticate);

router.get('/', articleController.index);
router.get('/:id', articleController.show);
router.post('/', uploadManuscript.single('manuscript'), articleController.store);
router.put('/:id', uploadManuscript.single('manuscript'), articleController.update);
router.delete('/:id', articleController.destroy);

export default router;
