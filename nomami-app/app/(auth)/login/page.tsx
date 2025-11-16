import { LoginForm } from "@/components/login-form";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await stackServerApp.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}