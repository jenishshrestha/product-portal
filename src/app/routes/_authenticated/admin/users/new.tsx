import { UsersNewPage } from "@features/users";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/users/new")({
  component: UsersNewPage,
});
