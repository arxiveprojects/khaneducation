import { motion } from "framer-motion";
import { BookOpen, Quote, ScrollText, Users } from "lucide-react";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { Link } from "react-router-dom";

export default function Index() {
  const features = [
    {
      icon: <ScrollText className="h-7 w-7" />,
      title: "Cited chapters",
      description: "Each lesson stays in an isolated iframe. Voice playback carries page and paragraph citations.",
    },
    {
      icon: <BookOpen className="h-7 w-7" />,
      title: "Book to studio",
      description: "Upload a PDF. Slidegen builds a TOC, then one interactive chapter at a time.",
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: "School tenancy",
      description: "Owners, teachers, and students share one school desk: enrollments, attendance, activity.",
    },
    {
      icon: <Quote className="h-7 w-7" />,
      title: "Visible jobs",
      description: "Generation is no longer a silent background task. Progress lives on the workspace.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto grid max-w-6xl items-end gap-12 px-5 py-20 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-muted-foreground">A school, not a catalog</p>
          <h1 className="mt-5 font-display text-6xl leading-[0.92] md:text-8xl">
            The page
            <span className="block italic text-primary">stays the source.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg text-muted-foreground">
            Khan Education is a school operating system. Books become cited interactive chapters. Teachers keep the roll. Jobs stay honest.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-full bg-primary px-7 py-3 text-sm text-primary-foreground shadow-medium">
              Get Started Free
            </Link>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full border border-border bg-card px-7 py-3 text-sm"
            >
              Explore Features
            </button>
          </div>
        </motion.div>
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="rounded-[1.75rem] border border-border bg-card p-7 shadow-large"
        >
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">Today&apos;s folio</p>
          <h2 className="mt-3 font-display text-3xl">Fractions</h2>
          <p className="mt-2 text-sm text-muted-foreground">Grade 6 · pp. 1–10 · isolated embed</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between rounded-xl bg-secondary/70 px-4 py-3">
              <span>Citation</span>
              <span className="text-primary">Page 4, ¶2</span>
            </div>
            <div className="flex justify-between rounded-xl bg-secondary/70 px-4 py-3">
              <span>Job</span>
              <span>ready</span>
            </div>
          </div>
        </motion.aside>
      </section>

      <section id="features" className="border-y border-border/80 py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-display text-4xl md:text-5xl">Built for the desk, not the feed</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft"
              >
                <div className="text-primary">{feature.icon}</div>
                <h3 className="mt-4 font-display text-2xl">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-display text-4xl">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Open a school", d: "Register, invite teachers, accept student applications." },
              { n: "02", t: "Upload a book", d: "Slidegen queues TOC, then one chapter at a time." },
              { n: "03", t: "Teach from the page", d: "Students open isolated chapters. You mark attendance." },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border border-border/80 bg-card p-6">
                <p className="font-display text-4xl italic text-primary">{step.n}</p>
                <h3 className="mt-4 font-display text-2xl">{step.t}</h3>
                <p className="mt-2 text-muted-foreground">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="border-t border-border/80 py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-display text-4xl">From the faculty</h2>
          <blockquote className="mt-8 max-w-3xl font-display text-3xl italic leading-snug">
            “The chapter stays on the page. Citations are not a footnote afterthought — they are the lesson.”
          </blockquote>
          <p className="mt-5 text-sm text-muted-foreground">Yusuf Rahimi · Mathematics</p>
        </div>
      </section>

      <section id="pricing" className="border-t border-border/80 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
          <div>
            <h2 className="font-display text-4xl">Start with the demo studio</h2>
            <p className="mt-2 text-muted-foreground">student@example.com · teacher@example.com · owner@example.com</p>
          </div>
          <Link to="/login" className="rounded-full bg-primary px-7 py-3 text-sm text-primary-foreground">
            Get Started Free
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
