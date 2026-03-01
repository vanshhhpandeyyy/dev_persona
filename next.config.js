/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for AWS Lambda / Docker / serverless
  output: 'standalone',
};

module.exports = nextConfig;
