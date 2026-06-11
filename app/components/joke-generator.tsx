"use client";

import { FormEvent, useState } from "react";

type JokeResponse = {
  topic: string;
  joke: string;
  error?: string;
};

export function JokeGenerator() {
  const [topic, setTopic] = useState("Postgres");
  const [joke, setJoke] = useState("");
  const [resolvedTopic, setResolvedTopic] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError("Enter a topic first.");
      setJoke("");
      return;
    }

    setIsLoading(true);
    setError("");
    setJoke("");

    try {
      const response = await fetch("/api/joke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: cleanTopic }),
      });
      const data = (await response.json()) as JokeResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "The joke agent could not respond.");
      }

      setResolvedTopic(data.topic);
      setJoke(data.joke);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The joke agent could not respond.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
          OpenAI Agents SDK
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Joke agent
        </h2>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="topic">
          Topic
        </label>
        <input
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none transition focus:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
          disabled={isLoading}
          id="topic"
          maxLength={120}
          name="topic"
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Try databases, TypeScript, or coffee"
          value={topic}
        />
        <button
          className="rounded bg-zinc-950 px-4 py-2 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Writing..." : "Write joke"}
        </button>
      </form>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {joke ? (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {resolvedTopic}
          </p>
          <p className="text-lg leading-8 text-zinc-900 dark:text-zinc-100">
            {joke}
          </p>
        </div>
      ) : null}
    </section>
  );
}
