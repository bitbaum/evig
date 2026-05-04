/**
 * Admin Notification Email Templates
 *
 * Templates for admin notifications about new applications, proposals, and submissions.
 */

import { ORG } from '@\/config\/org';
import type { EmailContent } from '../types';
import { BASE_STYLES, COPYRIGHT_TEXT } from './base-styles';
import { escapeHtml } from '@/lib/utils/escape-html';

// Every name/email/title field below is user-controlled (form input from the
// applicant/proposer/submitter) and gets HTML-escaped before going into the
// mail body. Admins read these emails — keep their inbox safe from layout
// breakage and phishing-style HTML injection.

export const adminNewRepairerApplication = (
  applicantName: string,
  applicantEmail: string,
  adminDashboardUrl: string
): EmailContent => {
  const eName = escapeHtml(applicantName);
  const eEmail = escapeHtml(applicantEmail);
  return {
    subject: 'Neue Techniker-Bewerbung wartet auf Prüfung - ${ORG.name}',
    html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue Techniker-Bewerbung</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neue Techniker-Bewerbung</h1>
        </div>
        <div class="content">
          <p>Eine neue Techniker-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.</p>
          <p><strong>Bewerber:</strong> ${eName}</p>
          <p><strong>E-Mail:</strong> ${eEmail}</p>
          <p>Bitte prüfe die Bewerbung zeitnah, um eine schnelle Bearbeitung zu gewährleisten.</p>
          <a href="${adminDashboardUrl}" class="button button-green">Bewerbung prüfen</a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
    text: `
Eine neue Techniker-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.

Bewerber: ${applicantName}
E-Mail: ${applicantEmail}

Bitte prüfe die Bewerbung zeitnah:
${adminDashboardUrl}

Mit freundlichen Grüssen,
${ORG.name} System
  `.trim(),
  };
};

export const adminNewWorkshopProposal = (
  proposerName: string,
  proposerEmail: string,
  workshopTitle: string,
  adminDashboardUrl: string
): EmailContent => {
  const eName = escapeHtml(proposerName);
  const eEmail = escapeHtml(proposerEmail);
  const eTitle = escapeHtml(workshopTitle);
  return {
    subject: 'Neuer Workshop-Vorschlag wartet auf Prüfung - ${ORG.name}',
    html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neuer Workshop-Vorschlag</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neuer Workshop-Vorschlag</h1>
        </div>
        <div class="content">
          <p>Ein neuer Workshop-Vorschlag wurde eingereicht und wartet auf Ihre Prüfung.</p>
          <p><strong>Eingereicht von:</strong> ${eName}</p>
          <p><strong>E-Mail:</strong> ${eEmail}</p>
          <p><strong>Workshop-Titel:</strong> ${eTitle}</p>
          <p>Bitte prüfe den Vorschlag zeitnah, um eine schnelle Bearbeitung zu gewährleisten.</p>
          <a href="${adminDashboardUrl}" class="button button-green">Vorschlag prüfen</a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
    text: `
Ein neuer Workshop-Vorschlag wurde eingereicht und wartet auf Ihre Prüfung.

Eingereicht von: ${proposerName}
E-Mail: ${proposerEmail}
Workshop-Titel: ${workshopTitle}

Bitte prüfe den Vorschlag zeitnah:
${adminDashboardUrl}

Mit freundlichen Grüssen,
${ORG.name} System
  `.trim(),
  };
};

export const adminNewBlogSubmission = (
  submitterName: string,
  submitterEmail: string,
  articleTitle: string,
  adminDashboardUrl: string
): EmailContent => {
  const eName = escapeHtml(submitterName);
  const eEmail = escapeHtml(submitterEmail);
  const eTitle = escapeHtml(articleTitle);
  return {
    subject: 'Neuer Blog-Beitrag wartet auf Prüfung - ${ORG.name}',
    html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neuer Blog-Beitrag</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neuer Blog-Beitrag</h1>
        </div>
        <div class="content">
          <p>Ein neuer Blog-Beitrag wurde eingereicht und wartet auf Ihre Prüfung.</p>
          <p><strong>Eingereicht von:</strong> ${eName}</p>
          <p><strong>E-Mail:</strong> ${eEmail}</p>
          <p><strong>Titel:</strong> ${eTitle}</p>
          <p>Bitte prüfe den Beitrag und entscheide über die Veröffentlichung.</p>
          <a href="${adminDashboardUrl}" class="button button-green">Beitrag prüfen</a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
    text: `
Ein neuer Blog-Beitrag wurde eingereicht und wartet auf Ihre Prüfung.

Eingereicht von: ${submitterName}
E-Mail: ${submitterEmail}
Titel: ${articleTitle}

Bitte prüfe den Beitrag:
${adminDashboardUrl}

Mit freundlichen Grüssen,
${ORG.name} System
  `.trim(),
  };
};

export const adminNewSellerApplication = (
  applicantName: string,
  applicantEmail: string,
  adminDashboardUrl: string
): EmailContent => {
  const eName = escapeHtml(applicantName);
  const eEmail = escapeHtml(applicantEmail);
  return {
    subject: 'Neue Verkäufer-Bewerbung wartet auf Prüfung - ${ORG.name}',
    html: `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue Verkäufer-Bewerbung</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header header-green">
          <h1>Neue Verkäufer-Bewerbung</h1>
        </div>
        <div class="content">
          <p>Eine neue Verkäufer-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.</p>
          <p><strong>Bewerber:</strong> ${eName}</p>
          <p><strong>E-Mail:</strong> ${eEmail}</p>
          <p>Bitte prüfe die Bewerbung zeitnah, um eine schnelle Bearbeitung zu gewährleisten.</p>
          <a href="${adminDashboardUrl}" class="button button-green">Bewerbung prüfen</a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert.</p>
          <p>${COPYRIGHT_TEXT}</p>
        </div>
      </div>
    </body>
    </html>
  `,
    text: `
Eine neue Verkäufer-Bewerbung wurde eingereicht und wartet auf Ihre Prüfung.

Bewerber: ${applicantName}
E-Mail: ${applicantEmail}

Bitte prüfe die Bewerbung zeitnah:
${adminDashboardUrl}

Mit freundlichen Grüssen,
${ORG.name} System
  `.trim(),
  };
};
