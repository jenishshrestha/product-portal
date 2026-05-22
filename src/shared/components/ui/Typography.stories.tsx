import type { Meta, StoryObj } from "@storybook/react";

const sampleText = "The quick brown fox jumps over the lazy dog";

const headings = [
  { tag: "h1", classes: "text-4xl font-bold tracking-tight lg:text-5xl" },
  { tag: "h2", classes: "text-3xl font-semibold tracking-tight" },
  { tag: "h3", classes: "text-2xl font-semibold tracking-tight" },
  { tag: "h4", classes: "text-xl font-semibold tracking-tight" },
] as const;

const bodyStyles = [
  { label: "p (default)", classes: "text-base leading-7" },
  { label: "lead", classes: "text-xl text-muted-foreground" },
  { label: "large", classes: "text-lg font-semibold" },
  { label: "small", classes: "text-sm font-medium leading-none" },
  { label: "muted", classes: "text-sm text-muted-foreground" },
] as const;

const fontWeights = [
  { label: "Normal", class: "font-normal", value: "400" },
  { label: "Medium", class: "font-medium", value: "500" },
  { label: "Semibold", class: "font-semibold", value: "600" },
  { label: "Bold", class: "font-bold", value: "700" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TypographyShowcase() {
  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Typography</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Font families, heading scales, body text styles, and weights used across the design
          system.
        </p>
      </div>

      {/* Font Family */}
      <Section title="Font Family">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-5 space-y-2">
          <p className="text-xs font-mono text-muted-foreground">Inter</p>
          <p className="text-2xl text-foreground">Aa Bb Cc Dd Ee Ff Gg</p>
          <p className="text-base text-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p className="text-base text-foreground">abcdefghijklmnopqrstuvwxyz</p>
          <p className="text-base text-foreground">0123456789 !@#$%^&*()</p>
        </div>
      </Section>

      {/* Headings */}
      <Section title="Headings">
        <div className="grid gap-4">
          {headings.map(({ tag, classes }) => (
            <div
              key={tag}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
            >
              <p className="text-xs font-mono text-muted-foreground mb-2">
                {tag} — {classes}
              </p>
              <p className={`${classes} text-foreground`}>{sampleText}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Body & Text Styles */}
      <Section title="Body & Text Styles">
        <div className="grid gap-4 sm:grid-cols-2">
          {bodyStyles.map(({ label, classes }) => (
            <div
              key={label}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
            >
              <p className="text-xs font-mono text-muted-foreground mb-2">
                {label} — {classes}
              </p>
              <p className={classes}>{sampleText}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Font Weights */}
      <Section title="Font Weights">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fontWeights.map(({ label, class: cls, value }) => (
            <div
              key={label}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
            >
              <p className="text-xs font-mono text-muted-foreground mb-2">
                {cls} ({value})
              </p>
              <p className={`${cls} text-xl text-foreground`}>{label}</p>
              <p className={`${cls} text-base text-foreground`}>{sampleText}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Inline Styles */}
      <Section title="Inline Styles">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">bold</p>
            <p className="text-foreground">
              This is a <strong>bold</strong> word in a sentence.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">italic</p>
            <p className="text-foreground">
              This is an <em>italic</em> word in a sentence.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">inline code</p>
            <p className="text-foreground">
              This is <code className="bg-muted px-1.5 py-0.5 rounded text-sm">inline code</code> in
              a sentence.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">link</p>
            <p className="text-foreground">
              This is a{" "}
              <span className="text-primary underline underline-offset-4 cursor-pointer">
                link style
              </span>{" "}
              in text.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:col-span-2 lg:col-span-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">blockquote</p>
            <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
              "This is a blockquote style for quoted text."
            </blockquote>
          </div>
        </div>
      </Section>
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Typography",
  component: TypographyShowcase,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj;

/**
 * Typography reference showing font families, heading scales,
 * body text styles, weights, and inline formatting.
 */
export const Default: Story = {};
