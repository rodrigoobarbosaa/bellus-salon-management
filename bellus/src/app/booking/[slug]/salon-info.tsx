import { MapPin, Phone, Clock, Instagram } from "lucide-react";

interface Salon {
  nome: string;
  logo_url: string | null;
  cor_primaria: string;
  endereco: string | null;
  telefone: string | null;
  whatsapp: string | null;
  horario_funcionamento: Record<string, { abre: string; fecha: string } | null> | null;
  instagram_url: string | null;
  google_maps_url: string | null;
}

const DAY_LABELS: Record<string, string> = {
  seg: "Lun",
  ter: "Mar",
  qua: "Mié",
  qui: "Jue",
  sex: "Vie",
  sab: "Sáb",
  dom: "Dom",
};

const DAY_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

export function SalonInfo({ salon }: { salon: Salon }) {
  const hours = salon.horario_funcionamento;

  return (
    <div
      className="relative overflow-hidden pb-8 pt-10"
      style={{ backgroundColor: salon.cor_primaria }}
    >
      <div className="mx-auto max-w-lg px-4 text-center">
        {/* Logo */}
        {salon.logo_url ? (
          <img
            src={salon.logo_url}
            alt={salon.nome}
            className="mx-auto mb-4 h-20 w-20 rounded-full border-2 border-white/30 object-cover"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-3xl font-bold text-white">
            {salon.nome.charAt(0)}
          </div>
        )}

        <h1 className="text-2xl font-bold text-white">{salon.nome}</h1>

        {/* Contact info */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
          {salon.endereco && (
            <a
              href={salon.google_maps_url ?? `https://maps.google.com/?q=${encodeURIComponent(salon.endereco)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{salon.endereco}</span>
            </a>
          )}
          {salon.telefone && (
            <a href={`tel:${salon.telefone}`} className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="h-3.5 w-3.5" />
              <span>{salon.telefone}</span>
            </a>
          )}
          {salon.instagram_url && (
            <a href={salon.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              <Instagram className="h-3.5 w-3.5" />
              <span>Instagram</span>
            </a>
          )}
        </div>

        {/* Operating hours compact */}
        {hours && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white/90">
            <Clock className="h-3 w-3" />
            <span className="flex gap-1">
              {DAY_ORDER.map((day) => {
                const h = hours[day];
                return (
                  <span key={day} className={h ? "" : "opacity-40 line-through"}>
                    {DAY_LABELS[day]}
                  </span>
                );
              })}
            </span>
          </div>
        )}
      </div>

      {/* Curved bottom */}
      <div className="absolute -bottom-1 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
          <path d="M0,60 L0,20 Q720,0 1440,20 L1440,60 Z" fill="#fafaf9" />
        </svg>
      </div>
    </div>
  );
}
