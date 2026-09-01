import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Only run on app routes, excluding Next internals and static files.
  matcher: ["/", "/(en|ar)/:path*", "/((?!_next|api|.*\\..*).*)"],
};