import { getRepository } from 'typeorm';
import { Request, Response } from 'express';
import { Users } from '../entity/Users';
import { validate } from 'class-validator';

export class UserController {

  static getAll = async (req: Request, res: Response) => {
    const userRepository = getRepository(Users);
    let users;

    try {
      users = await userRepository.find({ select: ['id', 'role', 'firstName', 'lastName', 'whatsappNumber', 'email'] });
    } catch (e) {
      res.status(404).json({ message: 'Somenthing goes wrong!' });
    }

    if (users.length > 0) {
      res.send(users);
    } else {
      res.status(404).json({ 
        ok: false,
        message: 'Not result obtained' 
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
      res.status(404).json({ 
        ok: false,
        message: 'Not result obtained' 
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

    // Validate
    const validationOpt = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOpt);
    if (errors.length > 0) {
      return res.status(400).json({
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
      return res.status(409).json({
        ok: false,
        message: 'Email already exist' 
      });
    }
    // All ok
    res.status(200).json({ 
      ok: true,
      message: 'User created successfully!' 
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
      return res.status(404).json({ 
        ok: false,
        message: 'User not found' 
      });
    }
    const validationOpt = { validationError: { target: false, value: false } };
    const errors = await validate(user, validationOpt);

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: errors
      });
    }

    // Try to save user
    try {
      await userRepository.save(user);
    } catch (e) {
      return res.status(409).json({ 
        ok: false,
        message: 'Email already in use' 
      });
    }

    res.status(201).json({ 
      ok: true,
      message: 'User updated successfully!' 
    });
  };

  static delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRepository = getRepository(Users);
    let user: Users;

    try {
      user = await userRepository.findOneOrFail(id);
    } catch (e) {
      return res.status(404).json({ 
        ok: false,
        message: 'User not found' 
      });
    }

    // Remove user
    userRepository.delete(id);
    res.status(201).json({ 
      ok: true,
      message: 'User deleted successfully!' 
    });
  };
}

export default UserController;
