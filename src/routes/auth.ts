import { checkJwt } from './../middlewares/jwt';
import { Router } from 'express';
import AuthController from '../controller/AuthController';

const router = Router();

// login
router.post('/login', AuthController.login);

// forgot password
router.put('/forgot-password', AuthController.forgotPassword);

// Change password
router.post('/change-password', [checkJwt], AuthController.changePassword);

// Create new password
router.put('/new-password', AuthController.createNewPassword);


export default router;
 