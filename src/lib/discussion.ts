import "server-only";
import { createServerClient } from "@/lib/supabase/server";

export interface WorkComment {
  id: string;
  work_id: string;
  author_name: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

export interface VoteCounts {
  likes: number;
  dislikes: number;
}

export interface WorkDiscussion {
  comments: WorkComment[];
  workVotes: VoteCounts;
  commentVotes: Record<string, VoteCounts>;
}

function countVotes(votes: { vote: string }[] | null): VoteCounts {
  return (votes ?? []).reduce(
    (counts, item) => {
      if (item.vote === "like") counts.likes += 1;
      if (item.vote === "dislike") counts.dislikes += 1;
      return counts;
    },
    { likes: 0, dislikes: 0 }
  );
}

export async function getWorkDiscussion(workId: string): Promise<WorkDiscussion> {
  const supabase = createServerClient();
  const [commentsResult, workVotesResult] = await Promise.all([
    supabase
      .from("work_comments")
      .select("id, work_id, author_name, body, is_admin, created_at")
      .eq("work_id", workId)
      .order("created_at", { ascending: false }),
    supabase.from("work_votes").select("vote").eq("work_id", workId),
  ]);

  const comments = (commentsResult.data ?? []) as WorkComment[];
  let commentVotes: Record<string, VoteCounts> = {};

  if (comments.length > 0) {
    const result = await supabase
      .from("comment_votes")
      .select("comment_id, vote")
      .in("comment_id", comments.map((comment) => comment.id));

    commentVotes = (result.data ?? []).reduce<Record<string, VoteCounts>>((counts, item) => {
      const current = counts[item.comment_id] ?? { likes: 0, dislikes: 0 };
      if (item.vote === "like") current.likes += 1;
      if (item.vote === "dislike") current.dislikes += 1;
      counts[item.comment_id] = current;
      return counts;
    }, {});
  }

  return {
    comments,
    workVotes: countVotes(workVotesResult.data),
    commentVotes,
  };
}
