import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/focus/:path*",
    "/analytics/:path*",
    "/api/profile/:path*",
    "/api/settings/:path*",
    "/api/dashboard/:path*",
    "/api/focus/:path*",
    "/api/analytics/:path*",
  ],
}; 