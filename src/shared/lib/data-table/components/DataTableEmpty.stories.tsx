import { Button } from "@shared/components/ui/Button";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchIcon, UsersIcon } from "lucide-react";
import { DataTableEmpty } from "./DataTableEmpty";

/**
 * Empty-state placeholder for data tables and lists.
 */
const meta: Meta<typeof DataTableEmpty> = {
  title: "data-table/DataTableEmpty",
  component: DataTableEmpty,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = {
  args: {
    title: "No contacts yet",
    description: "Add your first contact to start collaborating.",
  },
};

export const WithIcon: Story = {
  args: {
    icon: <UsersIcon className="size-12" />,
    title: "No team members",
    description: "Invite teammates to see them here.",
  },
};

export const WithAction: Story = {
  args: {
    icon: <SearchIcon className="size-12" />,
    title: "No matching results",
    description: "Try adjusting filters or clearing your search.",
    action: <Button size="sm">Clear filters</Button>,
  },
};
