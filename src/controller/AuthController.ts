import { getRepository } from 'typeorm';
import { Request, Response } from 'express';
import { Users } from '../entity/Users';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { validate } from 'class-validator';
import { transporter } from '../config/mailer';

class AuthController {
  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).json({ message: ' Email & Password are required!' });
    }

    const userRepository = getRepository(Users);
    let user: Users;

    try {
      user = await userRepository.findOneOrFail({ where: { email } });
    } catch (e) {
      return res.status(400).json({ message: ' Email or password incorecct!' });
    }

    // Check password
    if (!user.checkPassword(password)) {
      return res.status(400).json({ message: 'Email or Password are incorrect!' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: '1h' });

    res.json({ message: 'OK', token, userId: user.id, role: user.role });
  };

  static changePassword = async (req: Request, res: Response) => {
    const { userId } = res.locals.jwtPayload;
    const { oldPassword, newPassword } = req.body;

    if (!(oldPassword && newPassword)) {
      res.status(400).json({ message: 'Old password & new password are required' });
    }

    const userRepository = getRepository(Users);
    let user: Users;

    try {
      user = await userRepository.findOneOrFail(userId);
    } catch (e) {
      res.status(400).json({ message: 'Somenthing goes wrong!' });
    }

    if (!user.checkPassword(oldPassword)) {
      return res.status(401).json({ message: 'Check your old Password' });
    }

    user.password = newPassword;
    const validationOps = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOps);

    if (errors.length > 0) {
      return res.status(400).json(errors);
    }

    // Hash password
    user.hashPassword();
    userRepository.save(user);

    res.json({ message: 'Password change!' });
  };

  static forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({message: 'Email is required!'});
    }

    const message = 'Check your email for a link to reset your password.';
    let verificationLink;
    let emailStatus = 'OK';

    // Get repository instance of Users
  
    const userRepository = getRepository(Users);
    let user : Users;

    try {

      // Find user email in database 
      user = await userRepository.findOneOrFail({where: {email}});
      const token = jwt.sign({userId: user.id, email: user.email}, config.jwtSecretReset, {expiresIn: '30m'});
      verificationLink = `http://localhost:4200/new-password/${token}`;
      user.resetToken = token;
      
    } catch (error) {
      return res.json({message});
    }

    //TODO: sendEmail to change password

    
    try {

      // send mail with defined transport object
      await transporter.sendMail({
        from: '"Reestablecer contraseña" <abinassar@gmail.com>', // sender address
        to: user.email, // list of receivers
        subject: "Enlace para reestablecer tu contraseña", // Subject line
        html: `
        <b>Por favor haz click en este enlace para cambiar tu contraseña:</b>
        <a href="${verificationLink}">${verificationLink}</a>
        <p> Este enlace tiene una validez de 30 minutos</p>
        `, // html body
      });

    } catch (error) {
      emailStatus = error;
      return res.status(400).json({message: 'Something goes wrong!'});
    }

    //Save user in database

    try {
      // Save user and resetToken field
      await userRepository.save(user);
    } catch (error) {
      emailStatus = error;
      return res.status(400).json({message: 'Something goes wrong!'});
    }

    res.json({ message, info: emailStatus});

  };

  static createNewPassword = async (req: Request, res: Response) => {

    const { newPassword } = req.body;
    const resetToken = req.headers.reset as string;

    // Verified if all fields are sended

    if (!(newPassword && resetToken)) {
      return res.status(400).json({message: 'All fields are required'})
    }

    const userRepository = getRepository(Users);
    let jwtPayload;
    let user: Users;

    try {
      // Verify token obtained from frontend and find this resetToken in database

      jwtPayload = jwt.verify(resetToken, config.jwtSecretReset);
      user = await userRepository.findOneOrFail({where: {resetToken}});

    } catch (error) {
      return res.status(401).json({message: 'error 1'});
    }

    // If get user validate user and change password

    user.password = newPassword;
    const validateOptions = { validationError: { target: false, value: false }};
    const errors = await validate(user, validateOptions);

    if (errors.length > 0) {
      return res.status(400).json(errors);
    }

    try {
      //Save user with new password
      user.hashPassword();
      await userRepository.save(user);
    } catch (error) {
      return res.status(401).json({ message: 'error 2'});
    }

    res.json({ message: 'Password changed successfully!'});


  }


}
export default AuthController;
