/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Sin caché de cliente para páginas dinámicas: al navegar, los datos se
    // piden siempre frescos. Evita listas/contadores viejos tras crear o borrar.
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
