import type { BranchSlug } from "@/features/order-mode/mode";

/** Lo que la persona va completando paso a paso (se envía al final). */
export type ReservationDraft = {
  branchSlug: BranchSlug;
  partySize: number;
  date: string;
  time: string;
  area: "" | "interior" | "terraza";
  occasion: string;
  name: string;
  phone: string;
  email: string;
  acceptPrivacy: boolean;
};

export type DraftUpdate = <K extends keyof ReservationDraft>(
  field: K,
  value: ReservationDraft[K],
) => void;

export type FieldErrors = Partial<Record<keyof ReservationDraft | "turnstileToken", string>>;
