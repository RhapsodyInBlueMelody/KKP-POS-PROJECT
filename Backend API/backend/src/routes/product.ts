import { Elysia, t } from 'elysia'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

function adminRoleChecker(user: { role: string }): boolean {
    return user.role === 'ADMIN'
}

const productBodySchema = t.Object({
    code: t.String({ minLength: 1 }),
    name: t.String({ minLength: 1 }),
    price: t.Number({ minimum: 0 }),
    stock: t.Integer({ minimum: 0 }),
    unit: t.String({ minLength: 1 }),
    categoryId: t.String({ minLength: 1 }),
})

export const getProductRoutes = new Elysia()
    .use(authMiddleware)
    .get('/products', async ({ query }) => {
        const { code } = query as { code?: string }

        const products = await prisma.product.findMany({
            where: code ? { category: { code } } : undefined,
        })

        return { products }
    })
    .patch('/product/:id', async ({ user, error, params, body }) => {
        if (!adminRoleChecker(user)) {
            return error(403, 'Forbidden')
        }

        try {
            const product = await prisma.product.update({
                where: { productId: params.id },
                data: {
                    price: body.price,
                    name: body.name,
                    code: body.code,
                    stock: body.stock,
                    unit: body.unit,
                    categoryId: body.categoryId,
                    // Audit fields must come from the authenticated user,
                    // never from the request body.
                    updatedBy: user.userId,
                }
            })

            return { product }
        } catch (e: any) {
            if (e.code === 'P2025') {
                return error(404, 'Product not found')
            }
            if (e.code === 'P2002') {
                return error(409, 'Product code already exists')
            }
            return error(500, 'Something went wrong')
        }
    }, {
        body: productBodySchema
    })
    .delete('/product/:id', async ({ user, error, params }) => {
        if (!adminRoleChecker(user)) {
            return error(403, 'Forbidden')
        }

        try {
            await prisma.product.delete({
                where: { productId: params.id }
            })

            return { message: 'Deleted Successfully' }
        } catch (e: any) {
            if (e.code === 'P2025') {
                return error(404, 'Product not found')
            }
            return error(500, 'Something went wrong')
        }
    })
    .post('/products', async ({ user, error, body }) => {
        if (!adminRoleChecker(user)) {
            return error(403, 'Forbidden')
        }

        try {
            const product = await prisma.product.create({
                data: {
                    ...body,
                    createdBy: user.userId,
                    updatedBy: user.userId,
                }
            })

            return { product }
        } catch (e: any) {
            if (e.code === 'P2002') {
                return error(409, 'Product code already exists')
            }
            return error(500, 'Something went wrong')
        }
    }, {
        body: productBodySchema
    })
