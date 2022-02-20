import { Router, Request, Response } from 'express';
import auth from './auth';
import user from './user';

const routes = Router();

routes.use('/auth', auth);
routes.use('/users', user);
routes.get('/', (req: Request, res: Response) =>{
    res.json({
        message: 'Welcome to phoinike API'
    })
});
//ffffffffffff
export default routes;
