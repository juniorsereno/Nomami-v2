"use client"

import { useActionState } from "react"
import { signIn } from "@/lib/actions/auth-actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, isPending] = useActionState(signIn, null)

  return (
    <form className={cn("flex flex-col gap-6", className)} action={formAction} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Faça login na sua conta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Digite seu email e senha para acessar
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="seu@email.com" 
            required 
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input 
            id="password" 
            name="password"
            type="password" 
            required 
          />
        </Field>
        {state?.error && (
          <div className="text-sm text-red-600 text-center">{state.error}</div>
        )}
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Primeiro acesso?{" "}
          <a href="/first-access" className="underline underline-offset-4">
            Crie sua senha aqui
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
