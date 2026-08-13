/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/payments',
        destination: '/pricing/',
        permanent: false
      }
    ]
  }
}

module.exports = nextConfig




