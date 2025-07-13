export default ({ env }: { env: (key: string, defaultValue?: any) => any }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env('FLAG_NPS', 'true') === 'true',
    promoteEE: env('FLAG_PROMOTE_EE', 'true') === 'true',
  },
});
