import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

export function RowSkeleton() {
  return <Skeleton className="h-16 w-full mb-2" />;
}

export function CardSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-lg" />;
}

export function ChatListSkeleton() {
  return (
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  )
}
