/**
 * Base Email Styles
 *
 * Shared CSS styles and HTML structure for all email templates.
 */

export const BASE_STYLES = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { padding: 20px; text-align: center; color: white; }
  .header-green { background-color: #22c55e; }
  .header-red { background-color: #dc2626; }
  .header-orange { background-color: #f59e0b; }
  .header-blue { background-color: #3b82f6; }
  .header-purple { background-color: #8b5cf6; }
  .content { padding: 30px 20px; background-color: #f9f9f9; }
  .button { display: inline-block; padding: 12px 24px; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  .button-green { background-color: #22c55e; }
  .button-orange { background-color: #f59e0b; }
  .button-blue { background-color: #3b82f6; }
  .button-purple { background-color: #8b5cf6; }
  .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e; background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
  .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  .highlight-box { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
`;

export const COPYRIGHT_TEXT = '© 2025 RevampIT - Die Zukunft der IT durch nachhaltige Aufarbeitung';
export const AUTO_GENERATED_TEXT = 'Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.';

export const createEmailLayout = (
  headerText: string,
  headerClass: string,
  content: string
): string => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerText}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header ${headerClass}">
      <h1>${headerText}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>${AUTO_GENERATED_TEXT}</p>
      <p>${COPYRIGHT_TEXT}</p>
    </div>
  </div>
</body>
</html>
`;

export const createTextFooter = (): string => `
Mit freundlichen Grüssen,
Das RevampIT Team
`;
