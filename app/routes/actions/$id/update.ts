import { ActionFunction, json } from "remix";
import invariant from "tiny-invariant";
import { sendEvent } from "~/graphJSON.server";
import { updateDocument } from "~/jsonDoc.client";

export const action: ActionFunction = async ({ params, request, context }) => {
  invariant(params.id, "expected params.id");

  const formData = await request.formData();
  const title = formData.get("title");
  const contents = formData.get("contents");

  // 至少需要一个字段
  if (!title && !contents) {
    return json({ error: "Expected at least title or contents" });
  }

  try {
    const document = await updateDocument(
      params.id,
      title ? String(title) : undefined,
      contents ? String(contents) : undefined
    );

    if (!document) return json({ error: "No document with that slug" });

    context.waitUntil(
      sendEvent({
        type: "update-doc",
        id: document.id,
        title: title ? String(title) : document.title,
      })
    );

    return json(document);
  } catch (error) {
    if (error instanceof Error) {
      return json({ error: error.message });
    } else {
      return json({ error: "Unknown error" });
    }
  }
};
