import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AuthRepository {
    async createUser(user: any) {
        return await prisma.user.create({ data: user });
    }

    async findByEmail(email: string) {
        return await prisma.user.findUnique({ where: { email } });
    }

    async findByPhone(phone: string) {
        return await prisma.user.findUnique({ where: { phone } });
    }
}

const authRepository = new AuthRepository();

export default authRepository;
