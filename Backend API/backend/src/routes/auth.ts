import bcrypt from 'bcryptjs';
import { Elysia, t } from 'elysia'; // Import 't' untuk skema validasi
import { jwt } from '@elysiajs/jwt';
import { prisma } from '../lib/prisma';

export const authRoutes = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
    }))
    .post('/login', async ({ jwt, body, set }) => {
        // Data di bawah ini dijamin 100% ada dan bertipe string karena sudah divalidasi oleh TypeBox
        const { username, password } = body;

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            set.status = 404; // Berikan HTTP Status yang sesuai arsitektur REST API
            return { message: "User not found" };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            set.status = 401; // 401 untuk kredensial tidak valid
            return { message: "Invalid credentials" };
        }

        // Tembak JWT Token dengan payload terstandarisasi
        const token = await jwt.sign({
            userId: user.userId,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        });

        return {
            message: "Login success",
            token,
            user: {
                name: user.name,
                role: user.role,
                username: user.username
            }
        };
    }, {
        // --- GERBANG VALIDASI OTOMATIS (KONTRAK KODE) ---
        body: t.Object({
            username: t.String({ error: "Username wajib diisi dan berupa teks" }),
            password: t.String({ error: "Password wajib diisi dan berupa teks" })
        })
    });
