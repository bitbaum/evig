export default ({ env }: { env: (key: string, defaultValue?: any) => any }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env('PORT', 1337),
  app: {
    keys: env('APP_KEYS', '').split(','),
  },
});
