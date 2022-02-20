import { getRepository } from 'typeorm';
import { Request, Response } from 'express';
import { Users } from '../entity/Users';
import { validate } from 'class-validator';
import { transporter } from '../config/mailer';

export class UserController {

  static getAll = async (req: Request, res: Response) => {
    const userRepository = getRepository(Users);
    let users;

    try {
      users = await userRepository.find({ select: ['id', 'role', 'firstName', 'lastName', 'whatsappNumber', 'email'] });
    } catch (e) {
      // res.status(404).json({ message: 'Somenthing goes wrong!' });
      res.json({ 
        ok: false,
        message: 'Somenthing goes wrong!' });
    }

    if (users.length > 0) {
      res.send(users);
    } else {
      // res.status(404).json({ 
        res.json({ 
          ok: false,
        message: 'No se obtuvieron resultados!' 
      });
    }
  };

  static getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRepository = getRepository(Users);
    try {
      const user = await userRepository.findOneOrFail(id);
      res.send(user);
    } catch (e) {
      // res.status(404).json({ 
        res.json({ 
          ok: false,
        message: 'No se obtuvieron resultados!' 
      });
    }
  };

  static new = async (req: Request, res: Response) => {

    const { firstName,
            lastName, 
            password, 
            role, 
            email, 
            whatsappNumber,
            resetToken } = req.body;
            
    const user = new Users();

    user.firstName = firstName;
    user.lastName = lastName;
    user.password = password;
    user.role = role;
    user.email = email;
    user.whatsappNumber = whatsappNumber;
    user.resetToken = resetToken;

    let confirmationCode = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < 20; i++ ) {
      confirmationCode += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    let confirmationLink = `https://phoinike-administration.web.app/confirmation/${confirmationCode}`;

    user.confirmationCode = confirmationCode;
    user.status = 'Pending';

    // Validate
    const validationOpt = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOpt);
    if (errors.length > 0) {
      // return res.status(400).json({
        return res.json({
          ok: false,
        message: errors
      });
    }

    // TODO: HASH PASSWORD

    const userRepository = getRepository(Users);
    try {
      user.hashPassword();
      await userRepository.save(user);
    } catch (e) {
      // return res.status(409).json({
        return res.json({
          ok: false,
        // message: 'Email already exist' 
        message: 'Ya existe un correo con ese nombre.'
      });
    }
    // All ok
    res.status(200).json({ 
      ok: true,
      // message: 'User created successfully!' 
      message: 'Usuario creado exitosamente!'
    });

    transporter.sendMail({
      from: '"Confirmar usuario" <abinassar@gmail.com>', // sender address
      to: user.email, // list of receivers
      subject: "Enlace para confirmar usuario", // Subject line
      html: `
      <b>Bienvenido a Phoinike Logistic</b>
      <b>Haz click aquí para verificar tu cuenta:</b>
      <a href="${confirmationLink}">${confirmationLink}</a>
      `, // html body
    });
  };

  static edit = async (req: Request, res: Response) => {
    let user;
    const { id } = req.params;
    const { firstName,
            lastName, 
            role, 
            email, 
            whatsappNumber } = req.body;

    const userRepository = getRepository(Users);
    // Try get user
    try {
      user = await userRepository.findOneOrFail(id);
      user.firstName = firstName;
      user.lastName = lastName;
      user.role = role;
      user.email = email;
      user.whatsappNumber = whatsappNumber;
    } catch (e) {
      // return res.status(404).json({ 
        return res.json({ 
          ok: false,
        // message: 'User not found' 
        message: 'Usuario no encontrado'
      });
    }
    const validationOpt = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOpt);

    if (errors.length > 0) {
      // return res.status(400).json({
        return res.json({
          ok: false,
        message: errors
      });
    }

    // Try to save user
    try {
      await userRepository.save(user);
    } catch (e) {
      // return res.status(409).json({ 
      return res.json({ 
        ok: false,
        // message: 'Email already in use'
        message: 'El correo ya está en uso. Por favor ingrese otro'
      });
    }

    res.status(201).json({ 
      ok: true,
      // message: 'User updated successfully!' 
      message: 'Usuario actualizado exitosamente!'
    });
  };

  static activateUser = async (req: Request, res: Response) => {

    const { confirmationCode } = req.body;

    if (!confirmationCode) {
      return res.json({
        ok: false,
        message: 'El código de confirmación es requerido!'
      });
    }

    // Get repository instance of Users
  
    const userRepository = getRepository(Users);
    let user : Users;

    try {

      // Find user email in database 
      user = await userRepository.findOneOrFail({where: {confirmationCode}});

      console.log('usuario conseguido en la base de datos ', user);
      
    } catch (error) {
      return res.json({
        ok: false,
        message: 'Correo no existe en base de datos!'
      });
    }

    const userRepositoryAll = getRepository(Users);
    // Try get user
    try {
      user = await userRepositoryAll.findOneOrFail(user.id);
      user.status = 'Activate';
    } catch (e) {
      // return res.status(404).json({ 
        return res.json({ 
          ok: false,
        // message: 'User not found' 
        message: 'Usuario no encontrado'
      });
    }
    const validationOpt = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOpt);

    if (errors.length > 0) {
      // return res.status(400).json({
        return res.json({
          ok: false,
        message: errors
      });
    }

    // Try to save user
    try {
      await userRepository.save(user);
    } catch (e) {
      // return res.status(409).json({ 
      return res.json({ 
        ok: false,
        // message: 'Email already in use'
        message: 'El correo ya está en uso. Por favor ingrese otro'
      });
    }

    res.status(201).json({ 
      ok: true,
      // message: 'User updated successfully!' 
      message: 'Usuario activado exitosamente!'
    });

  }

  static delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRepository = getRepository(Users);
    let user: Users;

    try {
      user = await userRepository.findOneOrFail(id);
    } catch (e) {
      // return res.status(404).json({ 
        return res.json({ 
          ok: false,
        // message: 'User not found' 
        message: 'Usuario no encontrado'
      });
    }

    // Remove user
    userRepository.delete(id);
    res.status(201).json({ 
      ok: true,
      // message: 'User deleted successfully!' 
      message: 'Usuario eliminado exitosamente!'
    });
  };

  static generateID(length: number): string {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}

export default UserController;
