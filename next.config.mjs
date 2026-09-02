/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/map",
        destination: "http://zefircraft.ddns.net:8123/?worldname=Towny",
        permanent: false,
      },
      {
        source: "/map/",
        destination: "http://zefircraft.ddns.net:8123/?worldname=Towny",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
