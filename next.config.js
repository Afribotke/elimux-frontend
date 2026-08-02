/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/internships',
        destination: '/opportunities',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig



