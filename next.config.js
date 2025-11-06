/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, 
  
  async headers() {
    return [
      {

        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",

              "style-src 'self' 'unsafe-inline'",

              "img-src 'self' data:",

              "connect-src 'self' https://*.supabase.co", 

              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '), 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;