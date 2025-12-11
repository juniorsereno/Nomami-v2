import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import sql from "./db-pool"
import { comparePassword } from "./auth/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          const users = await sql`
            SELECT id, nome, email, password_hash, role, ativo
            FROM users
            WHERE email = ${email}
            LIMIT 1
          `

          if (users.length === 0) {
            return null
          }

          const user = users[0]

          if (!user.ativo) {
            return null
          }

          // Verificar se tem senha (primeiro acesso ainda não foi feito)
          if (!user.password_hash || user.password_hash === '') {
            return null
          }

          const isValid = await comparePassword(password, user.password_hash)

          if (!isValid) {
            return null
          }

          // Atualizar last_login
          await sql`
            UPDATE users
            SET last_login = NOW()
            WHERE id = ${user.id}
          `

          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})
