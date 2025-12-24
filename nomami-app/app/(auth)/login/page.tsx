import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <a href="/dashboard">
            <Image
              src="/nomami-logo.jpeg"
              alt="NoMami Logo"
              width={150}
              height={40}
              priority
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/uploads/image_1752590464563.png"
          alt="Nomami Background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}