import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../Label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./NativeSelect";

/**
 * A styled wrapper around the native HTML select element.
 */
const meta: Meta<typeof NativeSelect> = {
  title: "ui/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  render: (args) => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="framework">Framework</Label>
      <NativeSelect id="framework" {...args}>
        <NativeSelectOption value="" disabled>
          Select a framework
        </NativeSelectOption>
        <NativeSelectOption value="react">React</NativeSelectOption>
        <NativeSelectOption value="vue">Vue</NativeSelectOption>
        <NativeSelectOption value="angular">Angular</NativeSelectOption>
        <NativeSelectOption value="svelte">Svelte</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default native select.
 */
export const Default: Story = {};

/**
 * A smaller native select variant.
 */
export const Small: Story = {
  args: {
    size: "sm",
  },
};

/**
 * A disabled native select.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/**
 * Native select with grouped options.
 */
export const WithGroups: Story = {
  render: (args) => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="tech">Technology</Label>
      <NativeSelect id="tech" {...args}>
        <NativeSelectOption value="" disabled>
          Select a technology
        </NativeSelectOption>
        <NativeSelectOptGroup label="Frontend">
          <NativeSelectOption value="react">React</NativeSelectOption>
          <NativeSelectOption value="vue">Vue</NativeSelectOption>
          <NativeSelectOption value="svelte">Svelte</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Backend">
          <NativeSelectOption value="node">Node.js</NativeSelectOption>
          <NativeSelectOption value="deno">Deno</NativeSelectOption>
          <NativeSelectOption value="bun">Bun</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </div>
  ),
};
