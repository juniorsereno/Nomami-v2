import { FirstAccessForm } from '@/components/auth/first-access-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function FirstAccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/login">
            <Image
              src="https://nomami.com.br/assets/LOGO_1752579727506-Cc7LLzXJ.png"
              alt="NoMami Logo"
              width={150}
              height={40}
              priority
            />
          </Link>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Primeiro Acesso</CardTitle>
            <CardDescription>
              Verifique sua identidade para configurar sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FirstAccessForm />
            <div className="mt-4 text-center text-sm">
                Já tem uma conta?{' '}
                <Link href="/login" className="underline underline-offset-4">
                    Fazer login
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}