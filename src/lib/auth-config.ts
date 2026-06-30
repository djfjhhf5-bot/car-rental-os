import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id && (!token.agencyId || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { agencyId: true },
        });
        if (dbUser) {
          token.agencyId = dbUser.agencyId;
        }
      }
      if (token.agencyId) {
        const agency = await prisma.agency.findUnique({
          where: { id: token.agencyId as string },
          select: { onboardingCompleted: true },
        });
        token.onboardingCompleted = agency?.onboardingCompleted ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { agencyId?: string }).agencyId = token.agencyId as string;
        (session.user as { onboardingCompleted?: boolean }).onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        "/dashboard",
        "/fleet",
        "/clients",
        "/bookings",
        "/contracts",
        "/payments",
        "/maintenance",
        "/settings",
        "/ai-chat",
      ];
      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL("/login", nextUrl);
        redirectUrl.searchParams.set("callbackUrl", nextUrl.href);
        return Response.redirect(redirectUrl);
      }
      return true;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
};
