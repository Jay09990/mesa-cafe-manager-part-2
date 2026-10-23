// Exposes the authenticated UploadThing file router at the documented API path.
import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "./core";

export const { GET, POST } = createRouteHandler({ router: uploadRouter });
