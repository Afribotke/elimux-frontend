/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  // Reduce memory usage during build
  staticPageGenerationTimeout: 120,
  experimental: {
    // Limit concurrent page generation
    workerThreads: false,
    cpus: 2
  }
}

module.exports = nextConfig
