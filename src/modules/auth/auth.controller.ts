import type { Request, Response } from "express";
import authService from "./auth.service.js";


export class AuthController {
    async registerUser(req: Request, res: Response) {
        const user = await authService.registerUser(req.body);
        return res.json(user);
    }

    async loginUser(req: Request, res: Response) {
        const user = await authService.loginUser(req.body);
        return res.json(user);
    }

    async logoutUser(req: Request, res: Response) {
        const user = await authService.logoutUser(req.body);
        return res.json(user);
    }

    async getCurrentUser(req: Request, res: Response) {
        const user = await authService.getCurrentUser(req.body);
        return res.json(user);
    }
}

const authController = new AuthController();

export default authController;