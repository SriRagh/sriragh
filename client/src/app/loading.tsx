import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Skeleton className="h-96" />
        </div>
        <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
