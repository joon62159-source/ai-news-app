import { auth } from "@clerk/nextjs/server";
import { fetchNewsForUser } from "@/lib/fetch-news";

// RSS 수집 후 기사마다 Claude를 호출하므로 기본 제한보다 길게 허용한다.
export const maxDuration = 300;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await fetchNewsForUser(userId));
  } catch (e) {
    console.error("fetch news failed", e);
    return Response.json(
      { error: "뉴스를 가져오지 못했어요" },
      { status: 500 },
    );
  }
}
