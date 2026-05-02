import authRepository from "./auth.repository.js";

export class AuthService {
    async registerUser(user: any) {
        return await authRepository.createUser(user);
    }

    async loginUser(user: any) {
        return await authRepository.findByEmail(user.email);
    }

    async logoutUser(user: any) {
        return await authRepository.findByEmail(user.email);
    }

    async getCurrentUser(user: any) {
        return await authRepository.findByEmail(user.email);
    }
}

const authService = new AuthService();

export default authService;