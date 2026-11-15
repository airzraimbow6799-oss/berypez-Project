"use client";

import { Flame, Leaf, Star } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Dialog, type DialogVariant } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { toast } from "@/components/ui/Toaster";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-borde border-t py-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-5 flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

const FILTERS = ["Sin picante", "Vegetariano", "Para niños", "Para compartir", "Hasta S/ 40"];

export function Showcase() {
  const [filters, setFilters] = useState<string[]>(["Sin picante"]);
  const [quantity, setQuantity] = useState(1);
  const [dialog, setDialog] = useState<DialogVariant | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Componentes</h1>
      <p className="text-tinta-suave mt-2">Vitrina para QA. No aparece en producción.</p>

      <Section title="Botones">
        <Button>Pedir ahora</Button>
        <Button variant="secundario">Reservar mesa</Button>
        <Button variant="fantasma">Ver la carta</Button>
        <Button variant="peligro">Cancelar pedido</Button>
        <Button isLoading>Pagar S/ 52.50</Button>
        <Button size="lg">Pagar con Yape</Button>
      </Section>

      <Section title="Filtros">
        {FILTERS.map((name) => (
          <Chip
            key={name}
            pressed={filters.includes(name)}
            onPressedChange={(on) =>
              setFilters((current) =>
                on ? [...current, name] : current.filter((value) => value !== name),
              )
            }
          >
            {name}
          </Chip>
        ))}
      </Section>

      <Section title="Etiquetas">
        <Badge tone="picante" icon={<Flame aria-hidden="true" className="size-3.5" />}>
          Picante
        </Badge>
        <Badge tone="vegetariano" icon={<Leaf aria-hidden="true" className="size-3.5" />}>
          Vegetariano
        </Badge>
        <Badge tone="favorito" icon={<Star aria-hidden="true" className="size-3.5" />}>
          Favorito
        </Badge>
        <Badge tone="promo">-20 %</Badge>
        <Badge tone="agotado">Agotado</Badge>
        <Badge>Para 2 personas</Badge>
      </Section>

      <Section title="Cantidad y avisos">
        <Stepper value={quantity} onChange={setQuantity} itemName="Ceviche" max={10} />
        <Button
          variant="secundario"
          onClick={() =>
            toast.success(`Agregaste ${quantity} Ceviche al carrito`, {
              action: { label: "Ver carrito", onClick: () => undefined },
            })
          }
        >
          Mostrar aviso
        </Button>
        <Button
          variant="fantasma"
          onClick={() => toast.error("No pudimos cobrar. Prueba otro medio de pago.")}
        >
          Aviso de error
        </Button>
      </Section>

      <Section title="Formulario">
        <div className="grid w-full gap-5 sm:grid-cols-2">
          <Input label="Nombre" name="nombre" autoComplete="name" required />
          <Input
            label="Celular"
            name="celular"
            inputMode="numeric"
            autoComplete="tel"
            hint="9 dígitos, empieza con 9"
            error="Ingresa un celular de 9 dígitos"
            required
          />
          <Select
            label="Distrito"
            name="distrito"
            placeholder="Elige tu distrito"
            options={[
              { value: "lince", label: "Lince" },
              { value: "jesus-maria", label: "Jesús María" },
              { value: "brena", label: "Breña" },
            ]}
          />
        </div>
      </Section>

      <Section title="Tarjeta y carga">
        <Card className="w-64 p-4">
          <h3 className="text-lg font-semibold">Parihuelas</h3>
          <p className="text-tinta-suave text-sm">Desde S/ 42.00</p>
        </Card>
        <Card className="w-64 p-4" aria-busy="true">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </Card>
      </Section>

      <Section title="Diálogos">
        <Button variant="secundario" onClick={() => setDialog("sheet")}>
          Vista rápida (hoja)
        </Button>
        <Button variant="secundario" onClick={() => setDialog("modal")}>
          Modal
        </Button>
        <Button variant="secundario" onClick={() => setDialog("drawer")}>
          Carrito (panel lateral)
        </Button>
      </Section>

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        variant={dialog ?? "sheet"}
        title="Parihuelas"
        description="Concentrado de pescado, mariscos y pulpa de cangrejo."
        footer={
          <Button className="w-full" onClick={() => setDialog(null)}>
            Agregar · S/ 42.00
          </Button>
        }
      >
        <p className="font-semibold">Elige tu pescado</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip pressed onPressedChange={() => undefined}>
            Pesca del día · S/ 42
          </Chip>
          <Chip pressed={false} onPressedChange={() => undefined}>
            Cabrilla · S/ 58
          </Chip>
        </div>
      </Dialog>
    </div>
  );
}
