"use client";

import { UserPlus } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { useDemoReady } from "@/components/panel/useDemoReady";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toaster";
import { useDemoStore } from "@/features/demo/store";
import { emailTaken, inviteSchema, type Member, ROLE_OPTIONS } from "@/features/staff/members";
import { type StaffRole } from "@/features/staff/roles";

/**
 * Módulo 1 · Personal (con datos de ejemplo): invitar, cambiar el rol y desactivar.
 * Siempre queda al menos una persona de administración activa.
 */
export function StaffManager({ currentEmail }: { currentEmail: string }) {
  const isReady = useDemoReady();
  const staff = useDemoStore((s) => s.staff);
  const inviteMember = useDemoStore((s) => s.inviteMember);
  const setMemberRole = useDemoStore((s) => s.setMemberRole);
  const setMemberActive = useDemoStore((s) => s.setMemberActive);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  if (!isReady) {
    return (
      <div className="mt-6" aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const changeRole = (member: Member, role: StaffRole) => {
    const result = setMemberRole(member.id, role);
    if (!result.ok) toast.error(result.message);
    else
      toast.success(
        `${member.name}: ahora es ${ROLE_OPTIONS.find((o) => o.value === role)?.label}`,
      );
  };

  const changeActive = (member: Member, isActive: boolean) => {
    const result = setMemberActive(member.id, isActive);
    if (!result.ok) toast.error(result.message);
    else
      toast.success(
        isActive ? `${member.name}: activa` : `${member.name}: desactivada, ya no puede entrar`,
      );
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Personal</h1>
          <p className="text-tinta-suave mt-1 max-w-prose">
            Quién entra al panel y qué ve. Al desactivar a alguien se corta su acceso, sin borrar su
            historial.
          </p>
        </div>
        <Button
          onClick={() => {
            setInviteCount((n) => n + 1);
            setIsInviting(true);
          }}
        >
          <UserPlus aria-hidden="true" className="size-5" /> Invitar persona
        </Button>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {staff.map((member) => (
          <li
            key={member.id}
            className={`bg-superficie border-borde grid gap-3 rounded-md border p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center ${member.isActive ? "" : "bg-crema-200"}`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{member.name}</h2>
                {member.email === currentEmail ? <Badge tone="favorito">Tú</Badge> : null}
                {member.isPending ? <Badge tone="promo">Invitación pendiente</Badge> : null}
              </div>
              <p className="text-tinta-suave text-sm break-all">
                {member.email} · {member.branch ?? "Todas las sedes"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`rol-${member.id}`}
                className="text-tinta-suave text-sm font-semibold"
              >
                Rol
              </label>
              <select
                id={`rol-${member.id}`}
                value={member.role}
                onChange={(e) => changeRole(member, e.target.value as StaffRole)}
                className="min-h-tactil bg-superficie border-borde hover:border-marino-600 rounded-sm border px-3 text-base"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Switch
              label={`${member.name}: activo`}
              checked={member.isActive}
              onChange={(on) => changeActive(member, on)}
            />
          </li>
        ))}
      </ul>

      <InviteDialog
        key={inviteCount}
        open={isInviting}
        onClose={() => setIsInviting(false)}
        existing={staff}
        onInvite={(invite) => {
          const member = inviteMember(invite);
          toast.success(`Invitación enviada a ${member.email}`);
          setIsInviting(false);
        }}
      />
    </div>
  );
}

function InviteDialog({
  open,
  onClose,
  existing,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  existing: readonly Member[];
  onInvite: (invite: ReturnType<typeof inviteSchema.parse>) => void;
}) {
  const formId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = inviteSchema.safeParse({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      role: String(data.get("role") ?? ""),
      branch: String(data.get("branch") ?? ""),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0] ?? "form")] ??= issue.message;
      setErrors(next);
      return;
    }
    if (emailTaken(existing, parsed.data.email)) {
      setErrors({ email: "Ya hay una persona con ese correo." });
      return;
    }
    onInvite(parsed.data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="modal"
      title="Invitar persona"
      description="Recibe un correo para crear su contraseña y entrar al panel."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="fantasma" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Enviar invitación
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input label="Nombre" name="name" required autoComplete="off" error={errors.name} />
        <Input label="Correo" name="email" type="email" required error={errors.email} />
        <Select
          label="Rol"
          name="role"
          required
          placeholder="Elige un rol"
          options={ROLE_OPTIONS}
          error={errors.role}
          onChange={(e) => setRole(e.target.value)}
        />
        <Select
          label="Sede"
          name="branch"
          placeholder={role === "admin" ? "Todas las sedes" : "Elige una sede"}
          options={[
            { value: "Lince", label: "Lince" },
            { value: "Jesús María", label: "Jesús María" },
          ]}
          hint="Administración puede ver todas las sedes; cocina y salón trabajan en una."
          error={errors.branch}
        />
      </form>
    </Dialog>
  );
}
