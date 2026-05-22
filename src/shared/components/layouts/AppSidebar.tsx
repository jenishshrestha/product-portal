import { Badge } from "@shared/components/ui/Badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/components/ui/Collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@shared/components/ui/Sidebar";
import { signOut } from "@shared/lib/auth/client";
import { useAuth } from "@shared/lib/auth/useAuth";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  BoxesIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

interface NavLeaf {
  to: string;
  label: string;
  icon?: typeof BoxesIcon;
  adminOnly?: boolean;
  /** When true, mark active only on exact pathname match (vs. startsWith). */
  exact?: boolean;
}

interface NavGroup {
  label: string;
  icon: typeof BoxesIcon;
  /** Pathname prefix used to compute active + auto-open state. */
  matchPath: string;
  adminOnly?: boolean;
  children: NavLeaf[];
}

type NavItem = NavLeaf | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  {
    label: "Products",
    icon: BoxesIcon,
    matchPath: "/products",
    children: [
      { to: "/products", label: "All Products", exact: true },
      { to: "/products/new", label: "Add New" },
      { to: "/admin/products/import", label: "Bulk Import", adminOnly: true },
    ],
  },
  { to: "/admin/users", label: "Users", icon: UsersIcon, adminOnly: true },
];

function isLeafActive(pathname: string, leaf: NavLeaf): boolean {
  return leaf.exact ? pathname === leaf.to : pathname.startsWith(leaf.to);
}

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const router = useRouter();
  const isAdmin = user?.roles?.includes("admin") ?? false;

  const visibleItems = NAV_ITEMS.flatMap<NavItem>((item) => {
    if (item.adminOnly && !isAdmin) {
      return [];
    }
    if (isGroup(item)) {
      const visibleChildren = item.children.filter((c) => !c.adminOnly || isAdmin);
      if (visibleChildren.length === 0) {
        return [];
      }
      return [{ ...item, children: visibleChildren }];
    }
    return [item];
  });

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <PackageIcon className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) =>
                isGroup(item) ? (
                  <NavGroupItem key={item.label} item={item} pathname={location.pathname} />
                ) : (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isLeafActive(location.pathname, item)}>
                      <Link to={item.to}>
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{user?.name}</span>
                    <span className="flex items-center gap-1.5">
                      <Badge
                        variant={user?.roles?.includes("admin") ? "default" : "secondary"}
                        className="h-4 px-1 text-xs"
                      >
                        {user?.roles?.includes("admin") ? "Admin" : "User"}
                      </Badge>
                    </span>
                  </div>
                  <ChevronUpIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await signOut();
                      } catch (err) {
                        if (import.meta.env.DEV) {
                          console.warn("[auth] signOut call failed:", err);
                        }
                      }
                      await router.invalidate();
                      await router.navigate({ to: "/login", search: { redirect: undefined } });
                    }}
                  >
                    <LogOutIcon className="mr-2 size-4" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavGroupItem({ item, pathname }: { item: NavGroup; pathname: string }) {
  const isActive = pathname.startsWith(item.matchPath);
  // Auto-open when on a child route so the user always sees their location.
  return (
    <Collapsible asChild className="group/collapsible" defaultOpen={isActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive}>
            <item.icon className="size-4" />
            <span>{item.label}</span>
            <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.to}>
                <SidebarMenuSubButton asChild isActive={isLeafActive(pathname, child)}>
                  <Link to={child.to}>
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
