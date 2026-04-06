import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // TODO: Add OAuth providers or credentials provider post-MVP
  // For MVP: single guest session — no login required
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
