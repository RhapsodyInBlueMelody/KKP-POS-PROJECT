import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const authMiddleware = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET!
        })
    )
    .derive({ as: 'global' }, async ({ jwt, headers, set }) => {
        const authHeader = headers.authorization

        if (!authHeader) {
            set.status = 401
            throw new Error('Unauthorized')
        }

        const token = authHeader.replace('Bearer ', '')

        try {
            const payload = await jwt.verify(token)
            console.log("payload:", payload)

            return {
                user: payload as {
                    userId: string
                    role: string
                    exp: number
                }
            }
        } catch {
            set.status = 401
            throw new Error('Unauthorized')
        }
    })
