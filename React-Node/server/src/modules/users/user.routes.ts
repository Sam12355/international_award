import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/me', userController.me);
router.patch('/me', userController.updateProfile);
router.put('/me/password', userController.updatePassword);
router.delete('/me', userController.deleteAccount);

export default router;
