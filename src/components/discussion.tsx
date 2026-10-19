"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCommentAction,
  setCommentVoteAction,
  setWorkVoteAction,
} from "@/app/work/[id]/actions";
import type { VoteCounts, WorkComment } from "@/lib/discussion";

type Vote = "like" | "dislike";
type VisitorVotes = Record<string, Vote>;
const VISITOR_EVENT = "sorsoch11i:visitor-votes-changed";

function ensureVisitorId() {
  let id = localStorage.getItem("sorsoch11i:visitor-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sorsoch11i:visitor-id", id);
  }
  return id;
}

function subscribeVisitor(callback: () => void) {
  window.addEventListener(VISITOR_EVENT, callback);
  ensureVisitorId();
  return () => window.removeEventListener(VISITOR_EVENT, callback);
}

function subscribeVotes(callback: () => void) {
  window.addEventListener(VISITOR_EVENT, callback);
  return () => window.removeEventListener(VISITOR_EVENT, callback);
}

function getVisitorSnapshot() {
  return localStorage.getItem("sorsoch11i:visitor-id") ?? "";
}

function getVotesSnapshot() {
  const id = getVisitorSnapshot();
  return id ? localStorage.getItem(`sorsoch11i:votes:${id}`) ?? "{}" : "{}";
}

function voteKey(target: string, id: string) {
  return `${target}:${id}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function Discussion({
  workId,
  comments,
  workVotes,
  commentVotes,
}: {
  workId: string;
  comments: WorkComment[];
  workVotes: VoteCounts;
  commentVotes: Record<string, VoteCounts>;
}) {
  const router = useRouter();
  const visitorId = React.useSyncExternalStore(subscribeVisitor, getVisitorSnapshot, () => "");
  const storedVotes = React.useSyncExternalStore(subscribeVotes, getVotesSnapshot, () => "{}");
  let myVotes: VisitorVotes = {};
  try {
    const parsed: unknown = JSON.parse(storedVotes);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      myVotes = parsed as VisitorVotes;
    }
  } catch {
    myVotes = {};
  }
  const [pending, startTransition] = React.useTransition();
  const [submitting, setSubmitting] = React.useState(false);

  function saveVote(key: string, vote: Vote | null) {
    const next = { ...myVotes };
    if (vote) next[key] = vote;
    else delete next[key];
    localStorage.setItem(`sorsoch11i:votes:${visitorId}`, JSON.stringify(next));
    window.dispatchEvent(new Event(VISITOR_EVENT));
  }

  function voteOnWork(vote: Vote) {
    const key = voteKey("work", workId);
    const nextVote = myVotes[key] === vote ? null : vote;
    startTransition(async () => {
      const result = await setWorkVoteAction(workId, visitorId, nextVote);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      saveVote(key, nextVote);
      router.refresh();
    });
  }

  function voteOnComment(commentId: string, vote: Vote) {
    const key = voteKey("comment", commentId);
    const nextVote = myVotes[key] === vote ? null : vote;
    startTransition(async () => {
      const result = await setCommentVoteAction(workId, commentId, visitorId, nextVote);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      saveVote(key, nextVote);
      router.refresh();
    });
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    try {
      const result = await createCommentAction(
        workId,
        String(formData.get("author_name") ?? ""),
        String(formData.get("body") ?? "")
      );
      if (result.error) return toast.error(result.error);
      form.reset();
      toast.success("Комментарий добавлен");
      router.refresh();
    } catch {
      toast.error("Не удалось отправить комментарий");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 border-t border-neutral-200 pt-7 dark:border-neutral-800">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Оценка и комментарии</h2>

      <div className="mt-4">
        <VoteButtons
          counts={workVotes}
          selected={myVotes[voteKey("work", workId)]}
          disabled={!visitorId || pending}
          onVote={voteOnWork}
          label="Оценить работу"
        />
      </div>

      <form onSubmit={submitComment} className="mt-6 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Оставить комментарий</h3>
        <Input name="author_name" maxLength={40} placeholder="Имя (необязательно)" aria-label="Имя" />
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={4}
          placeholder="Напишите комментарий..."
          aria-label="Комментарий"
          className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} size="sm">
            {submitting ? "Отправка..." : "Отправить"}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {comment.author_name || (comment.is_admin ? "Администратор" : "Гость")}
                </span>
                {comment.is_admin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" /> Администратор
                  </span>
                ) : null}
                <time className="ml-auto text-xs text-neutral-500 dark:text-neutral-400" dateTime={comment.created_at}>
                  {formatDate(comment.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-neutral-700 dark:text-neutral-300">
                {comment.body}
              </p>
              <div className="mt-3">
                <VoteButtons
                  counts={commentVotes[comment.id] ?? { likes: 0, dislikes: 0 }}
                  selected={myVotes[voteKey("comment", comment.id)]}
                  disabled={!visitorId || pending}
                  onVote={(vote) => voteOnComment(comment.id, vote)}
                  label="Оценить комментарий"
                  compact
                />
              </div>
            </article>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Комментариев пока нет. Будьте первым!
          </p>
        )}
      </div>
    </section>
  );
}

function VoteButtons({
  counts,
  selected,
  disabled,
  onVote,
  label,
  compact = false,
}: {
  counts: VoteCounts;
  selected?: Vote;
  disabled: boolean;
  onVote: (vote: Vote) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <Button
        type="button"
        variant={selected === "like" ? "secondary" : "outline"}
        size="sm"
        disabled={disabled}
        aria-label={`${label}: нравится, ${counts.likes}`}
        aria-pressed={selected === "like"}
        onClick={() => onVote("like")}
        className={selected === "like" ? "text-emerald-700 dark:text-emerald-300" : ""}
      >
        <ThumbsUp className="h-4 w-4" /> {!compact || counts.likes > 0 ? counts.likes : "Нравится"}
      </Button>
      <Button
        type="button"
        variant={selected === "dislike" ? "secondary" : "outline"}
        size="sm"
        disabled={disabled}
        aria-label={`${label}: не нравится, ${counts.dislikes}`}
        aria-pressed={selected === "dislike"}
        onClick={() => onVote("dislike")}
        className={selected === "dislike" ? "text-red-700 dark:text-red-300" : ""}
      >
        <ThumbsDown className="h-4 w-4" /> {!compact || counts.dislikes > 0 ? counts.dislikes : "Не нравится"}
      </Button>
    </div>
  );
}
