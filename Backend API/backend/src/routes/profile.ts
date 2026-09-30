import { Elysia } from 'elysia'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const profileRoutes = new Elysia()
    .use(authMiddleware)
    .get('/profile', async ({ user, error }) => {
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

        if (!profile) {
            return error(404, 'Profile not found')
        }

        return { profile }
    })
