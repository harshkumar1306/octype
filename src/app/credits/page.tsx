import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/ui/InfoPageLayout";

export const metadata: Metadata = {
  title: "Credits & Audio Attribution",
  description:
    "Attribution and credits for open source piano samples, licences, and technical assets utilized in Octype virtual piano.",
  alternates: {
    canonical: "/credits",
  },
};

export default function CreditsPage(): JSX.Element {
  return (
    <InfoPageLayout>
      <article className="prose prose-invert max-w-none">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-fg mb-6">
          Credits & Attributions
        </h1>

        <p className="font-sans text-sm leading-relaxed text-fg-muted mb-6">
          Octype is built upon high-quality open-source assets and libraries. We are incredibly grateful 
          to the authors and musicians who share their work with the community.
        </p>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Salamander Grand Piano
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            The rich acoustic piano tones utilized in Octype are powered by the <strong>Salamander Grand Piano</strong>, 
            a massive, multi-velocity sampled Yamaha C5 grand piano created and compiled by <strong>Alexander Holm</strong>.
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li>
              <strong>Source:</strong> Distributed on the{" "}
              <a
                href="https://archive.org/details/SalamanderGrandPianoV3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-soft hover:underline"
              >
                Internet Archive
              </a>{" "}
              and various SF2/LinuxSampler mirrors.
            </li>
            <li>
              <strong>Licence:</strong> Creative Commons Attribution 3.0 Unported (
              <a
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-soft hover:underline"
              >
                CC BY 3.0
              </a>
              ).
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Creative Commons BY 3.0 Licensing Requirements
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Under the CC BY 3.0 license:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li><strong>Attribution:</strong> You must give appropriate credit to Alexander Holm, provide a link to the license, and indicate if changes were made.</li>
            <li><strong>Changes made:</strong> The raw 24-bit 48kHz WAV audio samples were converted into high-compression OGG Vorbis (.ogg) format to minimize network bandwidth and enable fast loading times in mobile and web environments. Audio channels and ranges were preserved exactly.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Technical Stack & Icons
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            This project is built using:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li><strong>Next.js:</strong> App Router, TypeScript, TailwindCSS.</li>
            <li><strong>Framer Motion:</strong> Responsive springs and panel animations.</li>
            <li><strong>Zustand:</strong> Fast, decoupled UI state stores.</li>
            <li><strong>Web Audio API:</strong> High-performance browser audio rendering.</li>
          </ul>
        </section>

        <section className="mb-8 border-t border-bg-subtle pt-6 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-sm text-accent-soft transition-colors hover:border-accent hover:bg-accent/20"
          >
            🎹 Launch Playable Piano
          </Link>
          <Link
            href="/about"
            className="rounded-md border border-bg-subtle bg-bg-elevated px-5 py-2 font-mono text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            About Octype
          </Link>
        </section>
      </article>
    </InfoPageLayout>
  );
}
