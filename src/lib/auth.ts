import { NextAuthOptions } from "next-auth";
import VercelPostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import GoogleProvider from "next-auth/providers/google";

// Pool 인스턴스 생성
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const authOptions: NextAuthOptions = {
  adapter: VercelPostgresAdapter(pool),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
}; 