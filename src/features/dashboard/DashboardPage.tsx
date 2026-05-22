import { useProductCounts } from "@features/products/api/useProducts";
import { Badge } from "@shared/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/Card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@shared/components/ui/Item";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@shared/components/ui/Pagination";
import { Skeleton } from "@shared/components/ui/Skeleton";
import { useAuth } from "@shared/lib/auth/useAuth";
import {
  ArchiveIcon,
  BoxesIcon,
  ClockIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 5;

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  if (current <= 3) return [0, 1, 2, 3, 4, null, total - 1];
  if (current >= total - 4) return [0, null, total - 5, total - 4, total - 3, total - 2, total - 1];
  return [0, null, current - 1, current, current + 1, null, total - 1];
}

const ACTIVITY_ITEMS = [
  {
    id: 1,
    icon: PencilIcon,
    iconClass: "text-foreground",
    action:
      '"Master of Business Administration" (University of Melbourne) — tuition fee updated by Superadmin',
    timeAgo: "2 hours ago",
  },
  {
    id: 2,
    icon: PlusCircleIcon,
    iconClass: "text-emerald-600",
    action: '"Bachelor of Computer Science" (University of Sydney) added by Superadmin',
    timeAgo: "5 hours ago",
  },
  {
    id: 3,
    icon: PencilIcon,
    iconClass: "text-foreground",
    action: '"Master of Data Science" (RMIT University) — intakes updated by Superadmin',
    timeAgo: "1 day ago",
  },
  {
    id: 4,
    icon: PencilIcon,
    iconClass: "text-foreground",
    action:
      '"Bachelor of Engineering" (Monash University) — English requirements edited by Superadmin',
    timeAgo: "2 days ago",
  },
  {
    id: 5,
    icon: PlusCircleIcon,
    iconClass: "text-emerald-600",
    action: '"Diploma in Hospitality Management" (William Angliss Institute) added by Superadmin',
    timeAgo: "3 days ago",
  },
  {
    id: 6,
    icon: Trash2Icon,
    iconClass: "text-destructive",
    action: '"Master of Public Health" (University of Queensland) deleted by Superadmin',
    timeAgo: "4 days ago",
  },
  {
    id: 7,
    icon: PencilIcon,
    iconClass: "text-foreground",
    action:
      '"Bachelor of Arts (Psychology)" (Macquarie University) — delivery mode updated by Superadmin',
    timeAgo: "5 days ago",
  },
  {
    id: 8,
    icon: PlusCircleIcon,
    iconClass: "text-emerald-600",
    action: '"Graduate Certificate in Project Management" (UNSW Sydney) added by Superadmin',
    timeAgo: "1 week ago",
  },
];

export function DashboardPage() {
  const { user, isPending } = useAuth();
  const counts = useProductCounts();
  const [page, setPage] = useState(0);
  const isAdmin = user?.roles?.includes("admin") ?? false;
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const totalPages = Math.ceil(ACTIVITY_ITEMS.length / PAGE_SIZE);
  const visibleItems = ACTIVITY_ITEMS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        {isPending || !user ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}.</h1>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "Admin" : "User"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>.
            </p>
          </>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={BoxesIcon}
          label="Total Active Products"
          value={counts.published}
          isLoading={counts.isLoading}
        />
        <MetricCard
          icon={ClockIcon}
          label="Pending Reviews for ETL run"
          value={counts.pendingReview}
          isLoading={counts.isLoading}
        />
        <MetricCard
          icon={ArchiveIcon}
          label="Disabled Products"
          value={counts.archived}
          isLoading={counts.isLoading}
        />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ItemGroup>
              {visibleItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <Item size="sm">
                      <ItemMedia variant="icon">
                        <Icon className={`size-4 ${item.iconClass}`} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="text-sm font-normal">{item.action}</ItemTitle>
                        <ItemDescription>{item.timeAgo}</ItemDescription>
                      </ItemContent>
                    </Item>
                    {index < visibleItems.length - 1 && <ItemSeparator />}
                  </div>
                );
              })}
            </ItemGroup>
            {totalPages > 1 && (
              <div className="border-t px-4 py-3">
                <Pagination className="justify-start">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={page > 0 ? () => setPage((p) => p - 1) : undefined}
                        aria-disabled={page === 0}
                        className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {getPageNumbers(page, totalPages).map((n, i) => (
                      <PaginationItem key={i}>
                        {n === null ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={n === page}
                            onClick={() => setPage(n)}
                            className="cursor-pointer"
                          >
                            {n + 1}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={page < totalPages - 1 ? () => setPage((p) => p + 1) : undefined}
                        aria-disabled={page === totalPages - 1}
                        className={
                          page === totalPages - 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
          <Icon className="size-4 text-foreground" />
        </div>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
