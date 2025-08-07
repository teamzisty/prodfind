import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey"
import { oneTap } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { admin as adminPlugin } from "better-auth/plugins";

import { db } from "./db";
import { sendEmail } from "./email";

export const auth = betterAuth({
    appName: "Prodfind",
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
    }),
    plugins: [passkey(), oneTap(), twoFactor(), adminPlugin()],
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Verify your email",
                html: `
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 32px; border-radius: 12px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                    <h2 style="color: #6366f1; margin-bottom: 16px;">Welcome to Prodfind!</h2>
                    <p style="font-size: 1.1em; color: #222; margin-bottom: 24px;">
                      You're almost there! Please verify your email address to activate your account.
                    </p>
                    <a href="${url}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); color: #fff; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1.1em; margin-bottom: 24px;">
                      Verify Email
                    </a>
                    <p style="font-size: 0.95em; color: #555; margin-top: 32px;">
                      If you did not request this, you can safely ignore this email.<br>
                      <span style="color: #aaa;">— The Prodfind Team</span>
                    </p>
                  </div>
                `,
            });
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    socialProviders: {
        google: {
            enabled: true,
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            enabled: true,
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    trustedOrigins: [process.env.NEXT_PUBLIC_BETTER_AUTH_URL!],
    user: {
        deleteUser: {
            enabled: true,
        },
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, newEmail, url }) => {
                await sendEmail({
                    to: user.email,
                    subject: 'Confirm Your Email Change Request',
                    html: `
                      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 32px; border-radius: 12px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                        <h2 style="color: #6366f1; margin-bottom: 16px;">Email Change Request</h2>
                        <p style="font-size: 1.1em; color: #222; margin-bottom: 18px;">
                          Hi <strong>${user.name || user.email}</strong>,
                        </p>
                        <p style="font-size: 1.05em; color: #333; margin-bottom: 18px;">
                          We received a request to change your Prodfind account email from <span style="color: #6366f1;">${user.email}</span> to <span style="color: #60a5fa;">${newEmail}</span>.
                        </p>
                        <a href="${url}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); color: #fff; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1.1em; margin-bottom: 24px;">
                          Approve Email Change
                        </a>
                        <p style="font-size: 0.97em; color: #555; margin-top: 28px;">
                          If you did not request this change, please ignore this email or contact our support team immediately.<br>
                          <span style="color: #aaa;">— The Prodfind Team</span>
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px 0;">
                        <p style="font-size: 0.85em; color: #888;">
                          For your security, this link will expire soon. If it does, you can always request a new email change from your account settings.
                        </p>
                      </div>
                    `
                });
            }
        }
    }
});