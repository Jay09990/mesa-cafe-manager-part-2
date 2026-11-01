"use client";

import type { ReactNode } from "react";
import { Skeleton } from "boneyard-js/react";

export function BoneyardSkeleton({ name, loading, fallback, fixture, children }: {
  name: string;
  loading: boolean;
  fallback: ReactNode;
  fixture?: ReactNode;
  children: ReactNode;
}) {
  return <Skeleton name={name} loading={loading} fallback={fallback} fixture={fixture} transition={150}>
    {children}
  </Skeleton>;
}

function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function DashboardSkeleton() {
  return <div role="status" aria-label="Loading dashboard" className="space-y-2">
    <span className="sr-only">Loading dashboard</span>
    <div className="space-y-2"><Bone className="h-8 w-40" /><Bone className="h-4 w-24" /></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2 rounded-lg border border-border bg-card p-3"><Bone className="h-4 w-24" /><Bone className="h-8 w-32" /><Bone className="h-3 w-40" /></div>)}</div>
    <div className="grid gap-2 lg:grid-cols-2">{Array.from({ length: 3 }, (_, index) => <div key={index} className={`space-y-2 rounded-lg border border-border bg-card p-3 ${index === 2 ? "lg:col-span-2" : ""}`}><Bone className="h-5 w-36" /><Bone className="h-56 w-full" /></div>)}</div>
  </div>;
}

export function TableSkeleton({ columns = 6, rows = 5, label = "Loading table" }: { columns?: number; rows?: number; label?: string }) {
  return <div role="status" aria-label={label} className="overflow-hidden rounded-lg border border-border bg-card p-3">
    <span className="sr-only">{label}</span>
    <div className="mb-4 flex gap-3">{Array.from({ length: columns }, (_, index) => <Bone key={index} className="h-4 flex-1" />)}</div>
    <div className="space-y-4">{Array.from({ length: rows }, (_, row) => <div key={row} className="flex gap-3 border-t border-border pt-4">{Array.from({ length: columns }, (_, col) => <Bone key={col} className="h-5 flex-1" />)}</div>)}</div>
  </div>;
}

export function ListSkeleton({ rows = 4, label = "Loading items" }: { rows?: number; label?: string }) {
  return <div role="status" aria-label={label} className="space-y-3"><span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, index) => <div key={index} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"><div className="flex-1 space-y-2"><Bone className="h-5 w-1/3" /><Bone className="h-4 w-2/3" /></div><Bone className="h-10 w-28" /></div>)}</div>;
}

export function AdminPageSkeleton() {
  return <div role="status" aria-label="Loading page" className="space-y-5 p-1"><span className="sr-only">Loading page</span><Bone className="h-8 w-44" /><div className="grid gap-4 sm:grid-cols-2"><Bone className="h-12" /><Bone className="h-12" /></div><TableSkeleton /></div>;
}

export function PublicPageSkeleton() {
  return <div role="status" aria-label="Loading café page" className="mx-auto max-w-5xl space-y-12 px-5 py-12"><span className="sr-only">Loading café page</span><div className="space-y-4"><Bone className="h-5 w-32" /><Bone className="h-12 w-2/3" /><Bone className="h-5 w-48" /><Bone className="h-12 w-40" /></div><div className="space-y-4"><Bone className="h-8 w-44" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Bone key={index} className="h-28" />)}</div></div><div className="space-y-3"><Bone className="h-7 w-36" /><Bone className="h-5 w-52" /><Bone className="h-5 w-72" /></div></div>;
}
