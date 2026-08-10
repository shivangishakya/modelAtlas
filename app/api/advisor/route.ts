import { APICallError, LoadAPIKeyError, NoObjectGeneratedError } from "ai";
import {
  analyzeUseCase,
  advisorRequestSchema,
} from "../../model-atlas/advisor";
import {
  MAX_ADVISOR_DESCRIPTION_LENGTH,
  MAX_ADVISOR_REQUEST_BYTES,
  MIN_ADVISOR_DESCRIPTION_LENGTH,
} from "../../model-atlas/advisor-config";

export const maxDuration = 60;

const MAX_REQUESTS_PER_MINUTE = 10;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function errorResponse(message: string, status: number): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function getStatusCode(error: unknown): number | undefined {
  if (APICallError.isInstance(error)) return error.statusCode;
  if (typeof error !== "object" || error === null) return undefined;

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" ? statusCode : undefined;
}

function isRateLimited(request: Request): boolean {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientId = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = rateLimits.get(clientId);

  if (!current || current.resetAt <= now) {
    rateLimits.set(clientId, { count: 1, resetAt: now + 60_000 });

    if (rateLimits.size > 1_000) {
      for (const [key, limit] of rateLimits) {
        if (limit.resetAt <= now) rateLimits.delete(key);
      }
    }

    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS_PER_MINUTE;
}

export async function POST(request: Request): Promise<Response> {
  if (isRateLimited(request)) {
    return errorResponse(
      "Too many advisor requests. Please wait a minute and try again.",
      429,
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ADVISOR_REQUEST_BYTES) {
    return errorResponse("The advisor request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Send a valid JSON advisor request.", 400);
  }

  const parsedRequest = advisorRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse(
      `Describe the work in ${MIN_ADVISOR_DESCRIPTION_LENGTH}–${MAX_ADVISOR_DESCRIPTION_LENGTH.toLocaleString()} characters and use only the listed priorities.`,
      400,
    );
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return errorResponse(
      "The AI advisor is not configured for this deployment. The site owner must add the Gemini API key.",
      503,
    );
  }

  try {
    const result = await analyzeUseCase(parsedRequest.data);
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const statusCode = getStatusCode(error);

    if (
      LoadAPIKeyError.isInstance(error) ||
      statusCode === 401 ||
      statusCode === 403
    ) {
      return errorResponse(
        "The AI advisor is not configured for this deployment. The site owner must add the Gemini API key.",
        503,
      );
    }

    if (statusCode === 429) {
      return errorResponse(
        "The AI advisor is busy right now. Please try again shortly.",
        429,
      );
    }

    if (NoObjectGeneratedError.isInstance(error)) {
      return errorResponse(
        "The AI advisor could not produce a reliable recommendation. Please add more detail and try again.",
        502,
      );
    }

    console.error("Model advisor request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      statusCode,
    });

    return errorResponse(
      "The AI advisor is temporarily unavailable. Please try again shortly.",
      503,
    );
  }
}
