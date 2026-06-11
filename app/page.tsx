import { sql } from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function getDbVersion() {
  const result = (await sql`SELECT version()`) as { version: string }[];

  return result[0]?.version ?? "Unknown";
}

export default async function Home() {
  const version = await getDbVersion();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Server Component
        </p>
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-50">
          Next.js + Neon
        </h1>
      </div>
      <p className="rounded border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        PostgreSQL Version: {version}
      </p>
    </main>
  );
}
