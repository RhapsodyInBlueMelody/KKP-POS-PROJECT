import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const transactionItemSchema = t.Object({
    productId: t.String({ minLength: 1 }),
    quantity: t.Integer({ minimum: 1 }),
});

const paymentMethodSchema = t.Union([
    t.Literal('QRIS'),
    t.Literal('CASH'),
    t.Literal('TRANSFER'),
]);

export const transactionRoutes = new Elysia()
    .use(authMiddleware)
    .post('/transaction', async ({ body, user, set }) => {
        try {
            if (!user) {
                set.status = 401;
                return { message: 'Transaksi Gagal!', detail: 'Sesi kasir tidak valid.' };
            }

            const { items, paymentMethod } = body;

            // A product may only appear once in a checkout request. This keeps
            // stock validation and transaction-item creation unambiguous.
            const productIds = new Set(items.map(item => item.productId));
            if (productIds.size !== items.length) {
                set.status = 400;
                return {
                    message: 'Transaksi Gagal!',
                    detail: 'Produk yang sama tidak boleh muncul lebih dari sekali dalam satu transaksi.'
                };
            }

            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const transactionCode = `TRX${date}${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

            const result = await prisma.$transaction(async (tx) => {
                const products = await Promise.all(
                    items.map(item => tx.product.findUnique({
                        where: { productId: item.productId },
                        select: {
                            productId: true,
                            name: true,
                            price: true,
                            stock: true,
                        }
                    }))
                );

                for (let index = 0; index < products.length; index++) {
                    const product = products[index];
                    const item = items[index];

                    if (!product) {
                        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
                    }

                    if (product.stock < item.quantity) {
                        throw new Error(`Stok untuk "${product.name}" tidak mencukupi! (Sisa: ${product.stock}, Diminta: ${item.quantity})`);
                    }
                }

                const totalPrice = products.reduce((sum, product, index) => {
                    if (!product) return sum;
                    return sum + Number(product.price) * items[index].quantity;
                }, 0);

                const transaction = await tx.transaction.create({
                    data: {
                        code: transactionCode,
                        totalPrice,
                        kasirId: user.userId,
                        paymentMethod,
                    }
                });

                for (let index = 0; index < products.length; index++) {
                    const product = products[index];
                    const item = items[index];

                    if (!product) {
                        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
                    }

                    // The price is copied from the database, never from the client.
                    await tx.transactionItem.create({
                        data: {
                            code: `TRXITEM${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`,
                            quantity: item.quantity,
                            priceAtTime: Number(product.price),
                            transactionId: transaction.transactionId,
                            productId: product.productId,
                        }
                    });

                    // The stock condition makes the decrement atomic. If another
                    // checkout consumes the remaining stock first, this update
                    // affects zero rows and the whole database transaction rolls back.
                    const stockUpdate = await tx.product.updateMany({
                        where: {
                            productId: product.productId,
                            stock: { gte: item.quantity },
                        },
                        data: {
                            stock: { decrement: item.quantity },
                        }
                    });

                    if (stockUpdate.count !== 1) {
                        throw new Error(`Stok untuk "${product.name}" berubah dan tidak lagi mencukupi. Silakan coba lagi.`);
                    }
                }

                return transaction;
            });

            return { message: 'Transaksi Berhasil', transactionCode: result.code };

        } catch (e: any) {
            set.status = 500;
            return {
                message: 'Transaksi Gagal!',
                detail: e.message || 'Terjadi kesalahan internal pada database.'
            };
        }
    }, {
        body: t.Object({
            items: t.Array(transactionItemSchema, { minItems: 1 }),
            paymentMethod: paymentMethodSchema,
        })
    })
    .get('/transactions', async ({ user, set }) => {
        try {
            if (!user) {
                set.status = 401;
                return { message: 'Gagal memuat histori!', detail: 'Sesi kasir tidak valid.' };
            }

            const history = await prisma.transaction.findMany({
                where: {
                    kasirId: user.userId
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            const formattedHistory = history.map(trx => ({
                ...trx,
                totalPrice: Number(trx.totalPrice),
                items: trx.items.map(item => ({
                    ...item,
                    priceAtTime: Number(item.priceAtTime)
                }))
            }));

            return {
                message: 'Histori transaksi berhasil dimuat',
                data: formattedHistory
            };

        } catch (e: any) {
            set.status = 500;
            return {
                message: 'Gagal memuat histori!',
                detail: e.message || 'Terjadi kesalahan internal pada database.'
            };
        }
    });
