import "server-only";
import { adminAuth, isAdminConfigured } from "@/lib/firebase/admin";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(request) {
  const match = /^Bearer (\S+)$/i.exec(
    request.headers.get("authorization") ?? "",
  );
  if (!match) throw new ApiError(401, "Please sign in to continue.");
  if (!isAdminConfigured())
    throw new ApiError(503, "Account services are not available yet.");
  try {
    return await adminAuth().verifyIdToken(match[1], true);
  } catch {
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
}

export function apiError(error) {
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
    },
    { status: error instanceof ApiError ? error.status : 500 },
  );
}
