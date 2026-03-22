import NextAuth from "next-auth";
import { authOptions } from "@/auth.config";

// Cast needed because @auth/core v5 (also in package.json) overrides next-auth v4 types.
// At runtime this is next-auth v4's NextAuth() which accepts authOptions correctly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = (NextAuth as any)(authOptions);

export { handler as GET, handler as POST };
