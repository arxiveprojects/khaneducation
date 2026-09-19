import { BrandMark } from "@/components/brand/BrandMark";

export default function Footer() {
  return (
    <footer className="border-t border-border/80 bg-[hsl(22_24%_12%)] py-16 text-[hsl(36_36%_92%)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3 md:px-8">
        <div>
          <BrandMark inverted />
          <p className="mt-6 max-w-sm text-sm text-white/60">
            A school OS for cited chapters, attendance, and slidegen jobs — not another generic course catalog.
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45">Studio</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Interactive chapters</li>
            <li>Attendance rolls</li>
            <li>Generation jobs</li>
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45">School</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Teachers and owners</li>
            <li>Student applications</li>
            <li>Cited voice playback</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl px-5 text-xs text-white/40 md:px-8">© {new Date().getFullYear()} Khan Education</p>
    </footer>
  );
}
