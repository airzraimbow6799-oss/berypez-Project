import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoginForm } from "@/components/panel/LoginForm";

export const metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="bg-superficie w-full max-w-sm rounded-lg p-6 shadow-md">
        <BrandLogo className="text-marino h-9 w-auto" />
        <h1 className="mt-6 text-2xl font-semibold">Panel del restaurante</h1>
        <p className="text-tinta-suave mt-1 text-sm">Ingresa con tu correo del personal.</p>
        <LoginForm />
      </div>
    </main>
  );
}
