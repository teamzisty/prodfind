import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const usersRouter = createTRPCRouter({
    /**
     * Add password
     */
    addPassword: baseProcedure
        .input(z.object({ password: z.string() }))
        .mutation(async ({ input }) => {
            try {
                const { password } = input;

                const result = await auth.api.setPassword({
                    headers: await headers(),
                    body: {
                        newPassword: password,
                    },
                });

                if (result.status) {
                    return {
                        success: true,
                    };
                } else {
                    return {
                        success: false,
                    };
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    return {
                        success: false,
                        error: error.message,
                    };
                } else {
                    return {
                        success: false,
                        error: 'An unknown error occurred',
                    };
                }
            }
        }),
});
