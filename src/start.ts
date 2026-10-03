import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { getTabSourceId } from "@/lib/tab-source";
import { mutationSource } from "@/server/mutation-source.server";

const tabSource = createMiddleware({ type: "function" })
  .client(({ next }) => next({ headers: { "x-tab-source": getTabSourceId() } }))
  .server(({ next }) => {
    const sourceId = z.uuid().optional().parse(getRequestHeader("x-tab-source"));
    return mutationSource.run(sourceId, () => next());
  });

export const startInstance = createStart(() => ({
  functionMiddleware: [tabSource],
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (ctx) => ctx.handlerType === "serverFn",
    }),
  ],
}));
