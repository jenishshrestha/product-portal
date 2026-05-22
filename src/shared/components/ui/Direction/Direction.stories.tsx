import type { Meta, StoryObj } from "@storybook/react";
import { DirectionProvider, useDirection } from "./Direction";

function DirectionDemo() {
  const direction = useDirection();
  return (
    <div className="rounded-lg border p-6 text-center">
      <p className="text-sm text-muted-foreground">Current direction</p>
      <p className="text-2xl font-semibold">{direction}</p>
    </div>
  );
}

/**
 * Provides a direction context for RTL/LTR support in Radix components.
 */
const meta: Meta<typeof DirectionProvider> = {
  title: "ui/Direction",
  component: DirectionProvider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  render: (args) => (
    <DirectionProvider {...args}>
      <DirectionDemo />
    </DirectionProvider>
  ),
  args: {
    direction: "ltr",
  },
  argTypes: {
    direction: {
      control: "radio",
      options: ["ltr", "rtl"],
    },
  },
} satisfies Meta<typeof DirectionProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Left-to-right direction (default).
 */
export const LTR: Story = {
  args: {
    direction: "ltr",
  },
};

/**
 * Right-to-left direction for Arabic, Hebrew, and other RTL languages.
 */
export const RTL: Story = {
  args: {
    direction: "rtl",
  },
};
