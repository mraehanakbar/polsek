import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Loader2, PhoneCall, Plus, X } from "lucide-react";
import type { ManualTicketPayload, Priority } from "../lib/types";

const CATEGORIES = [
  { value: "tawuran", label: "Gangguan Kamtibmas" },
  { value: "pidana", label: "Tindak Pidana" },
  { value: "bencana", label: "Bencana & Lingkungan" },
  { value: "laka", label: "Laka & Kemacetan" },
  { value: "kebakaran", label: "Kebakaran" },
  { value: "lain", label: "Lainnya" }
] as const;

const PRIORITIES: Array<{ value: "" | Priority; label: string }> = [
  { value: "", label: "Otomatis dari kategori" },
  { value: "P1", label: "P1 · Darurat" },
  { value: "P2", label: "P2 · Tinggi" },
  { value: "P3", label: "P3 · Normal" },
  { value: "P4", label: "P4 · Informasi" }
];

interface ManualTicketModalProps {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (payload: ManualTicketPayload) => Promise<void>;
}

export function ManualTicketModal({ open, busy, onClose, onCreate }: ManualTicketModalProps) {
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [category, setCategory] = useState<string>("tawuran");
  const [priority, setPriority] = useState<"" | Priority>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setReporterName("");
    setReporterPhone("");
    setCategory("tawuran");
    setPriority("");
    setTitle("");
    setDescription("");
    setAddress("");
    setLat("");
    setLng("");
    setConsent(false);
    setError(null);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!consent) {
      setError("Persetujuan pelapor wajib dicentang.");
      return;
    }
    const latitude = lat.trim() ? Number(lat) : undefined;
    const longitude = lng.trim() ? Number(lng) : undefined;
    if (
      (latitude !== undefined && !Number.isFinite(latitude)) ||
      (longitude !== undefined && !Number.isFinite(longitude))
    ) {
      setError("Koordinat tidak valid.");
      return;
    }
    try {
      await onCreate({
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        category,
        priority: priority || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        lat: latitude,
        lng: longitude,
        source: "telepon",
        reporterConsent: true
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal membuat tiket.");
    }
  }

  // Portal ke <body>: view induk memakai animasi transform yang membuat
  // position: fixed terkurung di area halaman (modal terpotong).
  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tiket manual">
      <form className="modal-card manual-card" onSubmit={handleSubmit}>
        <header className="modal-head">
          <div>
            <div className="eyebrow">TIKET MANUAL</div>
            <h3>
              <PhoneCall size={16} /> Laporan via telepon / loket
            </h3>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Tutup">
            <X size={16} />
          </button>
        </header>

        <div className="modal-body manual-grid">
          <label className="field">
            <span>Nama pelapor *</span>
            <input
              required
              minLength={3}
              value={reporterName}
              onChange={(event) => setReporterName(event.target.value)}
              placeholder="Nama lengkap"
            />
          </label>
          <label className="field">
            <span>Nomor telepon *</span>
            <input
              required
              minLength={8}
              value={reporterPhone}
              onChange={(event) => setReporterPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
            />
          </label>
          <label className="field">
            <span>Kategori *</span>
            <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Prioritas</span>
            <select
              className="select"
              value={priority}
              onChange={(event) => setPriority(event.target.value as "" | Priority)}
            >
              {PRIORITIES.map((item) => (
                <option key={item.value || "auto"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>Judul laporan *</span>
            <input
              required
              minLength={5}
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ringkasan singkat kejadian"
            />
          </label>
          <label className="field field-wide">
            <span>Deskripsi</span>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Kronologi, ciri pelaku, atau informasi lain..."
            />
          </label>
          <label className="field field-wide">
            <span>Alamat / patokan (wajib)</span>
            <input
              required
              minLength={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Jl. ... RT/RW ..."
            />
          </label>
          <label className="field">
            <span>Latitude (opsional)</span>
            <input
              value={lat}
              onChange={(event) => setLat(event.target.value)}
              placeholder="-6.26000"
              inputMode="decimal"
            />
          </label>
          <label className="field">
            <span>Longitude (opsional)</span>
            <input
              value={lng}
              onChange={(event) => setLng(event.target.value)}
              placeholder="106.98200"
              inputMode="decimal"
            />
          </label>
          <label className="check-item field-wide manual-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span className="check-box">✓</span>
            <span className="check-label">
              Pelapor menyetujui data diproses untuk penanganan laporan.
            </span>
          </label>
        </div>

        {error ? <div className="login-error modal-error">{error}</div> : null}

        <footer className="modal-foot">
          <span className="fine-print">Tiket manual langsung masuk antrean dan audit log.</span>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? <Loader2 className="spin" size={14} /> : <Plus size={14} />}
              {busy ? "Menyimpan..." : "Buat tiket"}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body
  );
}
