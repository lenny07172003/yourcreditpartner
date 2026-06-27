import { SignJWT, jwtVerify } from "jose";
import { OCG_ORG_ID } from "@/lib/org/context";

const TOKEN_AUDIENCE = "calendar-booking";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("[calendar] JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createBookingToken(referralId: string, orgId: string = OCG_ORG_ID) {
  return new SignJWT({ scope: TOKEN_AUDIENCE, org_id: orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(referralId)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyBookingToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), { audience: TOKEN_AUDIENCE });
  if (!payload.sub || payload.scope !== TOKEN_AUDIENCE) throw new Error("Invalid booking link");
  return {
    referralId: payload.sub,
    orgId: typeof payload.org_id === "string" ? payload.org_id : OCG_ORG_ID,
  };
}
