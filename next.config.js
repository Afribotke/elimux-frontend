/** @type {import('next').NextConfig} */
const nextConfig = {
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




