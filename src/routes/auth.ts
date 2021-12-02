import { checkJwt } from './../middlewares/jwt';
import { Router } from 'express';
import AuthController from '../controller/AuthController';
import { UserController } from './../controller/UserController';


const router = Router();

// login
router.post('/login', AuthController.login);

// Register
router.post('/register', UserController.new);

// forgot password
router.put('/forgot-password', AuthController.forgotPassword);

// Change password
router.post('/change-password', [checkJwt], AuthController.changePassword);

// Create new password
router.put('/new-password', AuthController.createNewPassword);


export default router;
 