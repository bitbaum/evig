export default ({ env }: { env: (key: string, defaultValue?: any) => any }) => ({
  // Email configuration (uncomment and configure when needed)
  // email: {
  //   config: {
  //     provider: 'sendgrid',
  //     providerOptions: {
  //       apiKey: env('SENDGRID_API_KEY'),
  //     },
  //     settings: {
  //       defaultFrom: env('EMAIL_FROM', 'noreply@example.com'),
  //       defaultReplyTo: env('EMAIL_REPLY_TO', 'noreply@example.com'),
  //     },
  //   },
  // },
  
  // Upload configuration (uncomment and configure when needed)
  // upload: {
  //   config: {
  //     provider: 'cloudinary',
  //     providerOptions: {
  //       cloud_name: env('CLOUDINARY_NAME'),
  //       api_key: env('CLOUDINARY_KEY'),
  //       api_secret: env('CLOUDINARY_SECRET'),
  //     },
  //     actionOptions: {
  //       upload: {},
  //       uploadStream: {},
  //       delete: {},
  //     },
  //   },
  // },
});
