"use client";

import {
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ActivitySize = "small" | "medium" | "large";

type Bucket = {
  id: string;
  name: string;
  fill: number;
  from: string;
  to: string;
  wash: string;
};

type Activity = {
  id: string;
  text: string;
  size: ActivitySize;
  bucketId: string;
  points: number;
};

type KeywordGroup = {
  label: string;
  keywords: string[];
};

const SIZE_POINTS: Record<ActivitySize, number> = {
  small: 8,
  medium: 18,
  large: 32,
};

const PALETTE = [
  ["#f43f5e", "#fb923c", "#fff1f2"],
  ["#0d9488", "#84cc16", "#ecfdf5"],
  ["#4f46e5", "#06b6d4", "#eef2ff"],
  ["#d97706", "#ef4444", "#fffbeb"],
  ["#9333ea", "#22c55e", "#f5f3ff"],
  ["#0284c7", "#f97316", "#eff6ff"],
  ["#dc2626", "#ec4899", "#fff1f2"],
  ["#059669", "#2563eb", "#ecfeff"],
];

const DEFAULT_BUCKETS: Bucket[] = [
  createBucket("Art", 0, 0, "default-art"),
  createBucket("Fitness", 0, 1, "default-fitness"),
  createBucket("Music", 0, 2, "default-music"),
];

const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    label: "Art",
    keywords: [
      "art",
      "paint",
      "painting",
      "draw",
      "drawing",
      "sketch",
      "clay",
      "pottery",
      "ceramic",
      "photo",
      "photography",
      "design",
    ],
  },
  {
    label: "Fitness",
    keywords: [
      "fitness",
      "boxing",
      "box",
      "run",
      "running",
      "walk",
      "workout",
      "gym",
      "lift",
      "yoga",
      "pilates",
      "swim",
      "bike",
      "cycle",
      "climb",
    ],
  },
  {
    label: "Music",
    keywords: [
      "music",
      "guitar",
      "piano",
      "sing",
      "singing",
      "drums",
      "violin",
      "song",
      "practice",
      "compose",
    ],
  },
  {
    label: "Reading",
    keywords: ["read", "reading", "book", "novel", "essay", "poetry"],
  },
  {
    label: "Outdoors",
    keywords: [
      "outdoors",
      "hike",
      "hiking",
      "camp",
      "garden",
      "gardening",
      "trail",
      "park",
      "kayak",
    ],
  },
  {
    label: "Cooking",
    keywords: [
      "cook",
      "cooking",
      "bake",
      "baking",
      "recipe",
      "meal",
      "bread",
    ],
  },
];

const sizeLabels: ActivitySize[] = ["small", "medium", "large"];

function createBucket(
  name: string,
  fill = 0,
  index = Date.now(),
  id = `${slugify(name)}-${index}-${Math.random().toString(36).slice(2, 7)}`,
): Bucket {
  const colors = PALETTE[index % PALETTE.length];

  return {
    id,
    name,
    fill,
    from: colors[0],
    to: colors[1],
    wash: colors[2],
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function scoreBucket(activityText: string, bucket: Bucket) {
  const normalizedActivity = normalize(activityText);
  const normalizedBucket = normalize(bucket.name).trim();
  const words = normalizedActivity.split(/\s+/).filter(Boolean);
  let score = 0;

  if (!normalizedActivity || !normalizedBucket) {
    return score;
  }

  if (normalizedActivity.includes(normalizedBucket)) {
    score += 16;
  }

  for (const word of normalizedBucket.split(/\s+/)) {
    if (word && words.includes(word)) {
      score += 6;
    }
  }

  for (const group of KEYWORD_GROUPS) {
    const groupLabel = normalize(group.label).trim();
    const bucketIsGroup =
      normalizedBucket.includes(groupLabel) ||
      group.keywords.some((keyword) => normalizedBucket.includes(keyword));

    if (!bucketIsGroup) {
      continue;
    }

    for (const keyword of group.keywords) {
      if (words.includes(keyword) || normalizedActivity.includes(keyword)) {
        score += 10;
      }
    }
  }

  return score;
}

function findBestBucket(activityText: string, buckets: Bucket[]) {
  return buckets
    .map((bucket) => ({ bucket, score: scoreBucket(activityText, bucket) }))
    .sort((a, b) => b.score - a.score)[0];
}

export default function HobbyBuckets() {
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hobbyName, setHobbyName] = useState("");
  const [activityText, setActivityText] = useState("");
  const [activitySize, setActivitySize] = useState<ActivitySize>("small");
  const [selectedBucketId, setSelectedBucketId] = useState("");
  const [celebration, setCelebration] = useState({ bucketId: "", nonce: 0 });
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestedMatch = useMemo(
    () => findBestBucket(activityText, buckets),
    [activityText, buckets],
  );
  const suggestedBucketId =
    suggestedMatch && suggestedMatch.score > 0 ? suggestedMatch.bucket.id : "";
  const targetBucketId = selectedBucketId || suggestedBucketId || buckets[0]?.id;
  const targetBucket = buckets.find((bucket) => bucket.id === targetBucketId);
  const totalFill = buckets.reduce((sum, bucket) => sum + bucket.fill, 0);
  const averageFill = buckets.length ? Math.round(totalFill / buckets.length) : 0;
  const fullestBucket = buckets.reduce<Bucket | undefined>(
    (winner, bucket) => (!winner || bucket.fill > winner.fill ? bucket : winner),
    undefined,
  );
  const nextPoints = SIZE_POINTS[activitySize];

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) {
        clearTimeout(celebrationTimer.current);
      }
    };
  }, []);

  function addHobby(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = hobbyName.trim();

    if (!trimmed) {
      return;
    }

    const alreadyExists = buckets.some(
      (bucket) => bucket.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (alreadyExists) {
      setHobbyName("");
      return;
    }

    setBuckets((current) => [...current, createBucket(trimmed, 0, current.length)]);
    setHobbyName("");
  }

  function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activityText.trim() || !targetBucket) {
      return;
    }

    const activity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: activityText.trim(),
      size: activitySize,
      bucketId: targetBucket.id,
      points: nextPoints,
    };

    setBuckets((current) =>
      current.map((bucket) =>
        bucket.id === targetBucket.id
          ? { ...bucket, fill: Math.min(100, bucket.fill + nextPoints) }
          : bucket,
      ),
    );
    setActivities((current) => [activity, ...current].slice(0, 12));
    setCelebration((current) => ({
      bucketId: targetBucket.id,
      nonce: current.nonce + 1,
    }));
    if (celebrationTimer.current) {
      clearTimeout(celebrationTimer.current);
    }
    celebrationTimer.current = setTimeout(() => {
      setCelebration((current) =>
        current.bucketId === targetBucket.id ? { ...current, bucketId: "" } : current,
      );
    }, 1800);
    setActivityText("");
    setSelectedBucketId("");
    setActivitySize("small");
  }

  function removeBucket(bucketId: string) {
    setBuckets((current) => current.filter((bucket) => bucket.id !== bucketId));
    setActivities((current) =>
      current.filter((activity) => activity.bucketId !== bucketId),
    );

    if (selectedBucketId === bucketId) {
      setSelectedBucketId("");
    }
  }

  function emptyBucket(bucketId: string) {
    setBuckets((current) =>
      current.map((bucket) =>
        bucket.id === bucketId ? { ...bucket, fill: 0 } : bucket,
      ),
    );
  }

  function resetBoard() {
    setBuckets(DEFAULT_BUCKETS);
    setActivities([]);
    setActivityText("");
    setHobbyName("");
    setSelectedBucketId("");
    setActivitySize("small");
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#fbf6ec] text-[#7b4458]">
      <div aria-hidden="true" className="cute-bg pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="cute-bubbles">
          {Array.from({ length: 26 }, (_, index) => (
            <span className="cute-bubble" key={`bubble-${index}`} />
          ))}
        </div>
        <div className="cute-stars">
          {Array.from({ length: 32 }, (_, index) => (
            <span className="cute-star" key={`star-${index}`} />
          ))}
        </div>
      </div>

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[430px_1fr] lg:px-8">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-5 lg:h-[calc(100vh-40px)]">
          <section className="cute-hero-panel relative overflow-hidden rounded-[34px] border-2 border-[#ffa4c8] bg-white/92 p-6 text-[#7b4458] shadow-[0_24px_70px_rgba(255,164,200,0.22)] backdrop-blur-sm">
            <div aria-hidden="true" className="panel-float panel-float--heart">♡</div>
            <div aria-hidden="true" className="panel-float panel-float--star">✦</div>
            <div aria-hidden="true" className="panel-float panel-float--bubble" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <p className="rounded-full bg-[#ffe0eb] px-3 py-1 text-sm font-bold uppercase text-[#914763]">
                Hobby Studio
              </p>
              <span className="rounded-full border border-[#97edaa] bg-[#e4fbe9] px-3 py-1 text-xs font-bold text-[#2f6a3f]">
                Live
              </span>
            </div>
            <h1 className="relative z-10 mt-5 text-[1.25rem] font-bold leading-[1.08] text-[#b35d7a] sm:text-[1.5rem]">
              Fill what feeds your soul
            </h1>
            <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
              <Metric label="Buckets" value={buckets.length.toString()} />
              <Metric label="Average" value={`${averageFill}%`} />
              <Metric label="Leader" value={fullestBucket?.name ?? "-"} />
            </div>
          </section>

          <section className="rounded-[34px] border-2 border-[#ffa4c8] bg-white/90 p-5 shadow-[0_18px_50px_rgba(255,164,200,0.2)] backdrop-blur-sm">
            <form onSubmit={addHobby}>
              <label
                className="flex items-center gap-2 text-lg font-bold text-[#914763]"
                htmlFor="hobby"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-[#914763] text-base leading-none">
                  +
                </span>
                New hobby
              </label>
              <input
                id="hobby"
                value={hobbyName}
                onChange={(event) => setHobbyName(event.target.value)}
                placeholder="e.g. Painting, Boxing..."
                className="mt-5 w-full rounded-full border-2 border-[#eadde3] bg-white px-4 py-3 text-base font-medium text-[#914763] shadow-inner outline-none transition placeholder:text-[#b08a99] focus:border-[#ffa4c8] focus:ring-4 focus:ring-[#ffd3e2]"
              />
              <button
                className="mt-4 w-full rounded-full bg-[#f8aac8] px-4 py-3 text-sm font-bold text-[#7b4458] shadow-[0_5px_0_#d98aaa] transition hover:-translate-y-0.5 hover:bg-[#ffbbd3] focus:outline-none focus:ring-4 focus:ring-[#ffd3e2] active:translate-y-1 active:shadow-[0_2px_0_#d98aaa]"
                type="submit"
              >
                Add Bucket
              </button>
            </form>
          </section>

          <section className="rounded-[34px] border-2 border-[#97edaa] bg-white/90 p-5 shadow-[0_18px_50px_rgba(151,237,170,0.2)] backdrop-blur-sm">
            <form onSubmit={addActivity}>
              <div className="flex items-center justify-between gap-3">
                <label
                  className="flex items-center gap-2 text-lg font-bold text-[#2f6a3f]"
                  htmlFor="activity"
                >
                  <span className="text-xl leading-none">≡</span>
                  Log activity
                </label>
                <span className="truncate rounded-full bg-[#e4fbe9] px-3 py-1 text-xs font-bold text-[#2f6a3f]">
                  {targetBucket ? `${targetBucket.name} +${nextPoints}` : "-"}
                </span>
              </div>
              <input
                id="activity"
                value={activityText}
                onChange={(event) => {
                  setActivityText(event.target.value);
                  setSelectedBucketId("");
                }}
                placeholder="painting"
                className="mt-5 w-full rounded-full border-2 border-[#eadde3] bg-white px-4 py-3 text-base font-medium text-[#2f6a3f] shadow-inner outline-none transition placeholder:text-[#8aa694] focus:border-[#97edaa] focus:ring-4 focus:ring-[#ccf8d5]"
              />

              <div className="mt-4 grid grid-cols-3 gap-2">
                {sizeLabels.map((size) => (
                  <button
                    className={`rounded-full border-2 px-3 py-2.5 text-sm font-bold capitalize transition ${
                      activitySize === size
                        ? "border-[#2f6a3f] bg-[#aef2bd] text-[#164725] shadow-[0_2px_0_#7fcf91]"
                        : "border-[#eadde3] bg-white text-[#7b4458] hover:border-[#97edaa] hover:text-[#2f6a3f]"
                    }`}
                    key={size}
                    type="button"
                    onClick={() => setActivitySize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <label
                  className="text-sm font-bold text-[#2f6a3f]"
                  htmlFor="bucket"
                >
                  Bucket
                </label>
                <select
                  id="bucket"
                  value={targetBucketId || ""}
                  onChange={(event) => setSelectedBucketId(event.target.value)}
                  className="mt-2 w-full rounded-full border-2 border-[#eadde3] bg-white px-4 py-3 text-base font-medium shadow-inner outline-none transition focus:border-[#97edaa] focus:ring-4 focus:ring-[#ccf8d5]"
                >
                  {buckets.map((bucket) => (
                    <option key={bucket.id} value={bucket.id}>
                      {bucket.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="mt-4 w-full rounded-full bg-[#aef2bd] px-4 py-3 text-sm font-bold text-[#2f6a3f] shadow-[0_5px_0_#83d397] transition hover:-translate-y-0.5 hover:bg-[#bcfac9] focus:outline-none focus:ring-4 focus:ring-[#ccf8d5] active:translate-y-1 active:shadow-[0_2px_0_#83d397] disabled:cursor-not-allowed disabled:bg-[#ded9db] disabled:text-[#837377] disabled:shadow-none"
                disabled={!buckets.length || !activityText.trim()}
                type="submit"
              >
                Fill Bucket!
              </button>
            </form>
          </section>

          <ActivityLog
            activities={activities}
            buckets={buckets}
            onReset={resetBoard}
          />
        </aside>

        <section className="cute-shelf-panel relative overflow-hidden rounded-[34px] border-2 border-[#f5c9dc] bg-white/88 p-5 shadow-[0_24px_70px_rgba(255,164,200,0.18)] backdrop-blur-sm">
          <div aria-hidden="true" className="panel-float panel-float--shelf-star">✦</div>
          <div aria-hidden="true" className="panel-float panel-float--shelf-heart">♡</div>
          <div aria-hidden="true" className="panel-float panel-float--shelf-bubble" />
          <div className="relative z-10 mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#eadde3] pb-4">
            <div>
              <p className="text-sm font-bold uppercase text-[#914763]">
                Bucket Shelf
              </p>
              <h2 className="mt-1 text-3xl font-bold text-[#b35d7a]">
                Daily balance
              </h2>
            </div>
            <div className="flex gap-2">
              {buckets.slice(0, 5).map((bucket) => (
                <span
                  aria-label={bucket.name}
                  className="h-4 w-4 rounded-full ring-2 ring-white"
                  key={bucket.id}
                  style={{ background: bucket.from }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {buckets.map((bucket) => (
              <BucketCard
                bucket={bucket}
                celebrationKey={celebration.nonce}
                isCelebrating={celebration.bucketId === bucket.id}
                isTarget={bucket.id === targetBucketId && Boolean(activityText)}
                key={bucket.id}
                onEmpty={() => emptyBucket(bucket.id)}
                onRemove={() => removeBucket(bucket.id)}
                onSelect={() => setSelectedBucketId(bucket.id)}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[22px] border-2 border-white bg-[#fff6fa]/86 px-3 py-2 shadow-[0_6px_18px_rgba(255,164,200,0.16)]">
      <p className="truncate text-xs font-bold text-[#914763]/75">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-[#b35d7a]">{value}</p>
    </div>
  );
}

function ActivityLog({
  activities,
  buckets,
  onReset,
}: {
  activities: Activity[];
  buckets: Bucket[];
  onReset: () => void;
}) {
  return (
    <section className="min-h-0 rounded-[30px] border-2 border-[#eadde3] bg-white/88 p-4 shadow-[0_18px_50px_rgba(255,164,200,0.14)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#914763]">Activity Log</h2>
        <button
          className="rounded-full border-2 border-[#eadde3] bg-white px-3 py-1.5 text-xs font-bold text-[#914763] transition hover:border-[#ffa4c8] hover:bg-[#fff0f6]"
          type="button"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      <div className="mt-3 flex max-h-52 flex-col gap-2 overflow-auto pr-1">
        {activities.length ? (
          activities.map((activity) => {
            const bucket = buckets.find((item) => item.id === activity.bucketId);

            return (
              <div
                className="rounded-[18px] border border-[#ffe0eb] bg-[#fffafd] px-3 py-2 shadow-sm"
                key={activity.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-bold text-[#7b4458]">
                    {activity.text}
                  </span>
                  <span className="shrink-0 rounded-full bg-[#ffe0eb] px-2 py-1 text-xs font-bold capitalize text-[#914763]">
                    {activity.size}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-[#9b7180]">
                  {bucket?.name ?? "Removed"} +{activity.points}
                </p>
              </div>
            );
          })
        ) : (
          <p className="rounded-[18px] border-2 border-dashed border-[#eadde3] bg-[#fffafd] px-3 py-3 text-sm font-medium text-[#9b7180]">
            No activities logged.
          </p>
        )}
      </div>
    </section>
  );
}

function BucketCard({
  bucket,
  celebrationKey,
  isCelebrating,
  isTarget,
  onEmpty,
  onRemove,
  onSelect,
}: {
  bucket: Bucket;
  celebrationKey: number;
  isCelebrating: boolean;
  isTarget: boolean;
  onEmpty: () => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const bucketStyle = {
    "--bucket-from": bucket.from,
    "--bucket-to": bucket.to,
    "--bucket-wash": bucket.wash,
  } as CSSProperties;
  const fillLabel = `${bucket.fill}% full`;
  const artId = slugify(bucket.id);
  const fillHeight = Math.round(162 * (bucket.fill / 100));
  const fillY = 230 - fillHeight;

  return (
    <article
      className={`relative overflow-hidden rounded-[30px] border-2 bg-white/90 p-4 shadow-[0_14px_34px_rgba(255,164,200,0.12)] transition duration-300 backdrop-blur-sm ${
        isCelebrating ? "hobby-bucket-card--celebrate" : ""
      } ${
        isTarget
          ? "border-[#ffa4c8] ring-4 ring-[#ffd3e2]"
          : "border-[#eadde3] hover:-translate-y-1 hover:border-[#ffa4c8] hover:shadow-[0_18px_42px_rgba(255,164,200,0.18)]"
      }`}
      style={bucketStyle}
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,var(--bucket-wash),rgba(255,255,255,0))]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: bucket.from }}
            />
            <h3 className="truncate text-2xl font-bold text-[#7b4458]">
              {bucket.name}
            </h3>
          </div>
          <div className="mt-3 h-2.5 w-32 overflow-hidden rounded-full bg-[#eadde3] shadow-inner">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--bucket-from),var(--bucket-to))] transition-all duration-700"
              style={{ width: `${bucket.fill}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            aria-label={`Empty ${bucket.name}`}
            className="h-8 w-8 rounded-full border-2 border-[#eadde3] bg-white text-sm font-bold text-[#9b7180] transition hover:border-[#97edaa] hover:bg-[#e4fbe9] hover:text-[#2f6a3f]"
            type="button"
            onClick={onEmpty}
          >
            0
          </button>
          <button
            aria-label={`Remove ${bucket.name}`}
            className="h-8 w-8 rounded-full border-2 border-[#eadde3] bg-white text-sm font-bold text-[#9b7180] transition hover:border-[#ffa4c8] hover:bg-[#fff0f6] hover:text-[#914763]"
            type="button"
            onClick={onRemove}
          >
            x
          </button>
        </div>
      </div>

      <button
        aria-label={`Select ${bucket.name}, ${fillLabel}`}
        className="relative mt-4 block w-full cursor-pointer px-2 pb-7 pt-2"
        type="button"
        onClick={onSelect}
      >
        <span className="sr-only">Select {bucket.name}</span>
        <span className="relative mx-auto block w-full max-w-[270px]">
          <svg
            aria-hidden="true"
            className={`hobby-bucket-art block h-auto w-full overflow-visible drop-shadow-[0_14px_18px_rgba(23,32,51,0.14)] ${
              isCelebrating ? "hobby-bucket-art--celebrate" : ""
            }`}
            key={`${bucket.id}-${isCelebrating ? celebrationKey : "idle"}`}
            viewBox="0 0 280 300"
          >
            <defs>
              <linearGradient
                id={`${artId}-body`}
                x1="42"
                x2="230"
                y1="74"
                y2="250"
              >
                <stop offset="0" stopColor="var(--bucket-wash)" />
                <stop
                  offset="0.58"
                  stopColor="var(--bucket-to)"
                  stopOpacity="0.5"
                />
                <stop offset="1" stopColor="var(--bucket-from)" />
              </linearGradient>
              <linearGradient
                id={`${artId}-fill`}
                x1="128"
                x2="166"
                y1="70"
                y2="230"
              >
                <stop offset="0" stopColor="var(--bucket-to)" />
                <stop offset="1" stopColor="var(--bucket-from)" />
              </linearGradient>
              <linearGradient
                id={`${artId}-rim`}
                x1="34"
                x2="246"
                y1="53"
                y2="84"
              >
                <stop offset="0" stopColor="var(--bucket-wash)" />
                <stop offset="0.55" stopColor="var(--bucket-to)" />
                <stop offset="1" stopColor="var(--bucket-from)" />
              </linearGradient>
              <clipPath id={`${artId}-clip`}>
                <path d="M57 62H223L204 248C201 264 184 273 140 273C96 273 79 264 76 248L57 62Z" />
              </clipPath>
            </defs>

            <ellipse cx="140" cy="278" fill="#d9a5b8" opacity="0.3" rx="94" ry="12" />

            <path
              d="M55 75C30 87 24 119 42 137"
              fill="none"
              stroke="#9b5f73"
              strokeLinecap="round"
              strokeWidth="7"
            />
            <rect
              fill="white"
              fillOpacity="0.78"
              height="44"
              rx="18"
              stroke="#9b5f73"
              strokeWidth="6"
              width="24"
              x="30"
              y="77"
            />
            <path
              d="M225 75C250 87 256 119 238 137"
              fill="none"
              stroke="#9b5f73"
              strokeLinecap="round"
              strokeWidth="7"
            />
            <rect
              fill="white"
              fillOpacity="0.78"
              height="44"
              rx="18"
              stroke="#9b5f73"
              strokeWidth="6"
              width="24"
              x="226"
              y="77"
            />

            <path
              d="M57 62H223L204 248C201 264 184 273 140 273C96 273 79 264 76 248L57 62Z"
              fill={`url(#${artId}-body)`}
              stroke="#9b5f73"
              strokeLinejoin="round"
              strokeWidth="6"
            />
            <g clipPath={`url(#${artId}-clip)`}>
              <rect
                fill={`url(#${artId}-fill)`}
                height={fillHeight}
                opacity="0.72"
                width="180"
                x="50"
                y={fillY}
              />
              <path
                className="hobby-bucket-wave"
                d={`M48 ${fillY + 5} C88 ${fillY - 10} 118 ${fillY + 20} 156 ${
                  fillY + 5
                } C190 ${fillY - 8} 212 ${fillY + 11} 232 ${fillY + 2} V240 H48 Z`}
                fill={`url(#${artId}-fill)`}
                opacity={bucket.fill ? "0.86" : "0"}
              />
              <ellipse
                cx="140"
                cy={fillY}
                fill="white"
                opacity={bucket.fill ? "0.22" : "0"}
                rx="88"
                ry="13"
              />
              <path
                d="M82 92C76 126 78 183 91 249"
                fill="none"
                opacity="0.2"
                stroke="white"
                strokeLinecap="round"
                strokeWidth="18"
              />
              <ellipse cx="190" cy="130" fill="white" opacity="0.18" rx="20" ry="34" />
              <circle cx="192" cy="223" fill="#b35d7a" opacity="0.12" r="13" />
            </g>

            <ellipse
              cx="140"
              cy="63"
              fill="#b35d7a"
              opacity="0.16"
              rx="93"
              ry="23"
            />
            <ellipse
              cx="140"
              cy="56"
              fill={`url(#${artId}-rim)`}
              rx="96"
              ry="25"
              stroke="#9b5f73"
              strokeWidth="6"
            />
            <ellipse cx="140" cy="55" fill="white" opacity="0.28" rx="78" ry="14" />
            <path
              d="M70 55C94 43 187 43 211 55"
              fill="none"
              opacity="0.32"
              stroke="white"
              strokeLinecap="round"
              strokeWidth="6"
            />

            <g className="hobby-bucket-face">
              <circle cx="108" cy="145" fill="#7d5ba6" r="18" />
              <circle cx="172" cy="145" fill="#7d5ba6" r="18" />
              <circle cx="101" cy="137" fill="white" opacity="0.88" r="6" />
              <circle cx="115" cy="152" fill="white" opacity="0.45" r="4" />
              <circle cx="165" cy="137" fill="white" opacity="0.88" r="6" />
              <circle cx="179" cy="152" fill="white" opacity="0.45" r="4" />
              <circle cx="82" cy="167" fill="#f7a9a1" opacity="0.62" r="10" />
              <circle cx="198" cy="167" fill="#f7a9a1" opacity="0.62" r="10" />
              <path
                className="hobby-bucket-smile"
                d="M128 169C133 177 147 177 152 169"
                fill="none"
                stroke="#7b4458"
                strokeLinecap="round"
                strokeWidth="5"
              />
              <path
                className="hobby-bucket-laugh"
                d="M124 168C129 192 151 192 156 168Z"
                fill="#7d5ba6"
                stroke="#7d5ba6"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              <path
                className="hobby-bucket-laugh"
                d="M132 185C137 189 144 189 149 185"
                fill="none"
                stroke="#f7a9a1"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </g>
          </svg>
          <span className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/95 px-5 py-1.5 text-sm font-bold text-[#914763] shadow-sm ring-1 ring-[#eadfce]">
            {fillLabel}
          </span>
        </span>
      </button>
    </article>
  );
}
