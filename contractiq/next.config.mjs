/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse'],
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
}

export default nextConfig
