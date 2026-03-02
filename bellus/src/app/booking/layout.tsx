import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar — Bellus",
  description: "Reserve su cita online",
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      {children}
    </div>
  );
}
