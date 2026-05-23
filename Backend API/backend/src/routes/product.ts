import { Elysia } from 'elysia'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

function adminRoleChecker(user: any): boolean {
    return user.role === 'ADMIN'
}

type ProductBody = {
    code: string
    name: string
    price: number
    stock: number
    unit: string
    categoryId: string
}

export const getProductRoutes = new Elysia()
    .use(authMiddleware)
    .get('/products', async ({ user, error, query }: any) => {


        const { code } = query as {
            code?: string
        }

        let products

        if (code) {

            products = await prisma.product.findMany({
                where: {
                    category: {
                        code: code
                    }
                },
            })

        } else {

            products = await prisma.product.findMany()

        }

        return { products }

    })
    .patch('/product/:id', async ({ user, error, params, body }: any) => {

        let isAdmin: boolean = adminRoleChecker(user)
        if (!isAdmin) {
            return error(403, 'Forbidden')
        }

        const product = await prisma.product.update({
            where: {
                productId: params.id
            },
            data: {
                price: body.price,
                name: body.name,
                code: body.code,
                stock: body.stock,
                unit: body.unit,
                categoryId: body.categoryId,
                updatedBy: body.userId
            }
        })

        return { product }
    })
    .delete('/product/:id', async ({ user, error, params }: any) => {

        let isAdmin: boolean = adminRoleChecker(user)
        if (!isAdmin) {
            return error(403, 'Forbidden')
        }

        await prisma.product.delete({
            where: {
                productId: params.id
            }
        })

        return { message: 'Deleted Successfully' }
    })
    .post('/products', async ({ user, error, body }: any) => {


        const { code, name, price, stock, unit, categoryId } = body as ProductBody

        let isAdmin = adminRoleChecker(user)

        if (!isAdmin) {
            return error(403, 'Forbidden')
        }


        try {
            const product = await prisma.product.create({
                data: {
                    code,
                    name,
                    price,
                    stock,
                    unit,
                    categoryId,
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

    })
