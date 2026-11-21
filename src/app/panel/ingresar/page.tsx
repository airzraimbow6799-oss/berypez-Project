import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoginForm } from "@/components/panel/LoginForm";
import { isDemoPanel } from "@/features/demo/config";

export const metadata = { title: "Ingresar" };
// Se decide en cada petición si el modo demostración está activo (variable de entorno).
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const demo = isDemoPanel();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-8">
      <div
        className={`bg-superficie w-full rounded-lg p-6 shadow-md ${demo ? "max-w-md" : "max-w-sm"}`}
      >
        <BrandLogo className="text-marino h-9 w-auto" />
        <h1 className="mt-6 text-2xl font-semibold">Panel del restaurante</h1>
        <p className="text-tinta-suave mt-1 text-sm">Ingresa con tu correo del personal.</p>
        <LoginForm demo={demo} />
      </div>
    </main>
  );
}
