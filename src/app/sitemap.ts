import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://octype.app";
  const routes = [
    "",
    "/computer-keyboard-piano",
    "/midi-piano",
    "/keyboard-mapping",
    "/how-to-play",
    "/about",
    "/credits",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
