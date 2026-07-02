import type { NextConfig } from "next";

const CALCULATOR_PATHS = [
  "hypotecnikalkulacka",
  "zivotnikalkulacka",
  "investicnikalkulacka",
  "penzijnikalkulacka",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  async redirects() {
    const calcRedirects = CALCULATOR_PATHS.flatMap((path) => [
      {
        source: `/${path}/`,
        destination: `/${path}`,
        permanent: true,
      },
      {
        source: `/${path}/index.html`,
        destination: `/${path}`,
        permanent: true,
      },
    ]);

    return calcRedirects;
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: "/financni-plan", destination: "/financni-plan/index.html" },
        { source: "/podnikatele", destination: "/podnikatele/index.html" },
        { source: "/gdpr", destination: "/gdpr/index.html" },
        { source: "/cookies", destination: "/cookies/index.html" },
        { source: "/fp-poradce", destination: "/fp-poradce/index.html" },
        { source: "/financni-analyza", destination: "/financni-analyza/index.html" },
        { source: "/reality", destination: "/reality/index.html" },
        { source: "/podnikatelelp", destination: "/podnikatelelp/index.html" },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
