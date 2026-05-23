import { Elysia } from 'elysia';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

export const transactionRoutes = new Elysia()
    .use(authMiddleware)
    .post('/transaction', async ({ body, user, set }: any) => {
        try {
            // Gerbang keamanan utama untuk mencegah error runtime objek null
            if (!user) {
                set.status = 401;
                return { message: "Transaksi Gagal!", detail: "Sesi kasir tidak valid." };
            }

            const { items, paymentMethod } = body as {
                items: { productId: string; quantity: number; priceAtTime: number }[];
                paymentMethod: string;
            };

            const totalPrice = items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const transactionCode = `TRX${date}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

            // Eksekusi ACID Transaction secara rapi dan aman
            const result = await prisma.$transaction(async (tx) => {
                const transaction = await tx.transaction.create({
                    data: {
                        code: transactionCode,
                        totalPrice: totalPrice,
                        kasirId: user.userId, // Langsung pakai userId secara mutlak
                        paymentMethod: paymentMethod,
                    }
                });

                await tx.transactionItem.createMany({
                    data: items.map((item, index) => ({
                        code: `TRXITEM${date}${index.toString().padStart(3, '0')}${Math.floor(1000 + Math.random() * 9000)}`,
                        quantity: item.quantity,
                        priceAtTime: item.priceAtTime,
                        transactionId: transaction.transactionId,
                        productId: item.productId,
                    }))
                });

                for (const item of items) {
                    // 1. Ambil data produk real-time di dalam transaksi
                    const currentProduct = await tx.product.findUnique({
                        where: { productId: item.productId },
                        select: { name: true, stock: true }
                    });

                    // 2. Jika produk tidak ketemu atau stoknya kurang, batalkan seluruh transaksi secara otomatis!
                    if (!currentProduct) {
                        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
                    }

                    if (currentProduct.stock < item.quantity) {
                        throw new Error(`Stok untuk "${currentProduct.name}" tidak mencukupi! (Sisa: ${currentProduct.stock}, Diminta: ${item.quantity})`);
                    }

                    // 3. Jika aman, baru lakukan decrement
                    await tx.product.update({
                        where: { productId: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }

                return transaction;
            });

            return { message: "Transaksi Berhasil", transactionCode: result.code };

        } catch (e: any) {
            set.status = 500;
            return {
                message: "Transaksi Gagal!",
                detail: e.message || "Terjadi kesalahan internal pada database."
            };
        }
    })
    .get('/transactions', async ({ user, set }: any) => {
        try {
            if (!user) {
                set.status = 401;
                return { message: "Gagal memuat histori!", detail: "Sesi kasir tidak valid." };
            }

            // Ambil data dari database Prisma sesuai nama relasi di skema lu
            const history = await prisma.transaction.findMany({
                where: {
                    kasirId: user.userId
                },
                include: {
                    items: { // SINKRON: Menggunakan 'items' sesuai isi model Transaction lu
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    code: true // Kita ambil code produk juga sekalian buat jaga-jaga di UI
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc' // Urutkan dari transaksi paling baru
                }
            });

            // Karena totalPrice bertipe Decimal, kita konversi datanya agar aman dibaca React Native
            const formattedHistory = history.map(trx => ({
                ...trx,
                totalPrice: Number(trx.totalPrice), // Ubah Decimal Prisma jadi Number biasa
                items: trx.items.map(item => ({
                    ...item,
                    priceAtTime: Number(item.priceAtTime)
                }))
            }));

            return {
                message: "Histori transaksi berhasil dimuat",
                data: formattedHistory
            };

        } catch (e: any) {
            set.status = 500;
            return {
                message: "Gagal memuat histori!",
                detail: e.message || "Terjadi kesalahan internal pada database."
            };
        }
    });
