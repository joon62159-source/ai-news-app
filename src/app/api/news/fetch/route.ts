import { auth } from "@clerk/nextjs/server";
import { fetchNewsForUser } from "@/lib/fetch-news";

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
