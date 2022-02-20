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
      // return res.json({ 
      return res.json({ 
        ok: false,
        message: ' Email & Contraseña son requeridos!'
      });
    }

    const userRepository = getRepository(Users);
    let user: Users;

    try {
      user = await userRepository.findOneOrFail({ where: { email } });
    } catch (e) {
      return res.json({ 
        ok: false,
        message: 'Contraseña o correo incorrecto!' 
      });
    }

    // Check password
    if (!user.checkPassword(password)) {
      return res.json({ 
        ok: false,
        message: 'Contraseña o correo incorrecto!' 
      });
    }

    if (user.status === 'Pending') {
      return res.json({ 
        ok: false,
        message: 'Usuario no activado!' 
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: '500h' });

    res.json({ 
      ok: true,
      message: 'Logueado exitosamente!', 
      token, 
      userId: user.id, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });
  };

  static changePassword = async (req: Request, res: Response) => {
    const { userId } = res.locals.jwtPayload;
    const { oldPassword, 
            newPassword 
          } = req.body;

    if (!(oldPassword && newPassword)) {
      res.json({ 
        ok: false,
        message: 'Contraseña antigua y nueva contraseña son requeridas!' 
      });
    }

    const userRepository = getRepository(Users);
    let user: Users;

    try {
      user = await userRepository.findOneOrFail(userId);
    } catch (e) {
      res.json({ 
        ok: false,
        message: 'Error fatal de servidor!' 
      });
    }

    if (!user.checkPassword(oldPassword)) {
      // return res.status(401).json({ 
      return res.json({ 
        ok: false,
        message: 'Verifica tu antigua contraseña' 
      });
    }

    user.password = newPassword;
    const validationOps = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOps);

    if (errors.length > 0) {
      return res.json({
        ok: false,
        message: errors
      });
    }

    // Hash password
    user.hashPassword();
    userRepository.save(user);

    res.json({ 
      ok: true,
      message: 'Contraseña cambiada exitosamente!' 
    });
  };

  static forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.json({
        ok: false,
        message: 'El correo es requerido!'
      });
    }

    // const message = 'Check your email for a link to reset your password.';
    const message = 'Se envió un link a tu email para resetear tu contraseña.';
    let verificationLink;
    let emailStatus = 'OK';

    // Get repository instance of Users
  
    const userRepository = getRepository(Users);
    let user : Users;

    try {

      // Find user email in database 
      user = await userRepository.findOneOrFail({where: {email}});
      const token = jwt.sign({userId: user.id, email: user.email}, config.jwtSecretReset, {expiresIn: '30m'});
      verificationLink = `https://phoinike-administration.web.app/new-password/${token}`;
      user.resetToken = token;
      
    } catch (error) {
      return res.json({
        ok: false,
        message: 'Correo no existe en base de datos!'
      });
    }

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
      return res.json({
        ok: false,
        // message: 'Something goes wrong!'
        message: 'Ocurrió un problema!'
      });
    }

    //Save user in database

    try {
      // Save user and resetToken field
      await userRepository.save(user);
    } catch (error) {
      emailStatus = error;
      return res.json({
        ok: false,
        // message: 'Something goes wrong!'
        message: 'Ocurrió un problema!'
      });
    }

    res.json({ 
      ok: true,
      message, 
      info: emailStatus
    });
  };

  static createNewPassword = async (req: Request, res: Response) => {

    const { newPassword } = req.body;
    const resetToken = req.headers.reset as string;

    // Verified if all fields are sended

    if (!(newPassword && resetToken)) {
      return res.json({
        ok: false,
        message: 'All fields are required'
      })
    }

    const userRepository = getRepository(Users);
    let jwtPayload;
    let user: Users;

    try {
      // Verify token obtained from frontend and find this resetToken in database

      jwtPayload = jwt.verify(resetToken, config.jwtSecretReset);
      user = await userRepository.findOneOrFail({where: {resetToken}});

    } catch (error) {
      // return res.status(401).json({
      //   ok: false,
      //   message: error
      // });
      return res.json({
        ok: false,
        message: 'El token enviado ha expirado!'
      });
    }

    // If get user validate user and change password

    user.password = newPassword;
    const validateOptions = { validationError: { target: false, value: false }};
    const errors = await validate(user, validateOptions);

    if (errors.length > 0) {
      return res.json({
        ok: false,
        message: errors
      });
    }

    try {
      //Save user with new password
      user.hashPassword();
      await userRepository.save(user);
    } catch (error) {
      return res.status(401).json({ 
        ok: false,
        message: error});
    }

    res.json({ 
      ok: true,
      // message: 'Password changed successfully!'
      message: 'Contraseña cambiada exitosamente!'
    });
  }


}
export default AuthController;
