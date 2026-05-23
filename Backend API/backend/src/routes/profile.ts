import { Elysia } from 'elysia'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const profileRoutes = new Elysia()
    .use(authMiddleware)
    .get('/profile', async ({ user }: any) => {
        console.log("route hit, user:", user)

        const profile = await prisma.user.findUnique({
            where: {
                userId: user.userId
            },
            select: {
                userId: true,
                code: true,
                name: true,
                username: true,
                role: true,
                createdAt: true,
            }
        })

        return { profile }
    })
