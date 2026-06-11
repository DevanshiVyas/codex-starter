import { sql } from "@/app/lib/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type CommentRow = {
  id: number;
  comment: string;
};

async function ensureCommentsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      comment TEXT NOT NULL
    )
  `;
}

async function getComments() {
  await ensureCommentsTable();

  return (await sql`
    SELECT id, comment
    FROM comments
    ORDER BY id DESC
  `) as CommentRow[];
}

export default async function ActionPage() {
  async function createComment(formData: FormData) {
    "use server";

    const comment = formData.get("comment");

    if (typeof comment !== "string" || comment.trim().length === 0) {
      return;
    }

    await ensureCommentsTable();
    await sql`INSERT INTO comments (comment) VALUES (${comment.trim()})`;
    revalidatePath("/action");
  }

  const comments = await getComments();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Server Action
        </p>
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-50">
          Comments
        </h1>
      </div>

      <form action={createComment} className="flex gap-3">
        <input
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
          name="comment"
          placeholder="Add a comment"
          type="text"
        />
        <button
          className="rounded bg-zinc-950 px-4 py-2 font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
          type="submit"
        >
          Submit
        </button>
      </form>

      <ul className="space-y-3">
        {comments.map((item) => (
          <li
            className="rounded border border-zinc-200 bg-zinc-50 p-3 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            key={item.id}
          >
            {item.comment}
          </li>
        ))}
      </ul>
    </main>
  );
}
