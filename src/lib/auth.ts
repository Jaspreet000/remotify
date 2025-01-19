import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth/next";
import jwt from 'jsonwebtoken';

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function verifyJWT(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET!;
  return jwt.verify(token, secret) as TokenPayload;
}

export async function verifyToken(req: Request): Promise<SessionUser | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);

    return {
      id: decoded.id,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: "user" | "admin";
}

export function generateToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET!;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}
