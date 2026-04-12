/**
 * Marketplace Email Templates
 *
 * All marketplace-related email notifications.
 * Swiss German text (ss not ß, proper umlauts).
 */

export interface MarketplaceEmailData {
  recipientName: string;
}

export interface ListingPublishedData extends MarketplaceEmailData {
  listingTitle: string;
  listingUrl: string;
}

export interface NewMarketplaceMessageData extends MarketplaceEmailData {
  senderName: string;
  listingTitle: string;
  messagePreview: string;
  conversationUrl: string;
}

export interface ListingReviewData extends MarketplaceEmailData {
  reviewerName: string;
  rating: number;
  listingTitle: string;
  reviewUrl: string;
}

/**
 * Listing published confirmation email
 */
export function listingPublishedConfirmation(data: ListingPublishedData): { subject: string; html: string; text: string } {
  return {
    subject: `Dein Inserat "${data.listingTitle}" ist jetzt live`,
    text: `Hallo ${data.recipientName}, dein Inserat "${data.listingTitle}" wurde erfolgreich veröffentlicht. Ansehen: ${data.listingUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Ihr Inserat ist online!</h2>
        <p>Hallo ${data.recipientName},</p>
        <p>Dein Inserat <strong>"${data.listingTitle}"</strong> wurde erfolgreich veröffentlicht und ist jetzt im Marketplace sichtbar.</p>
        <p>
          <a href="${data.listingUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Inserat ansehen
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Du erhältst eine Benachrichtigung, wenn jemand dein Inserat kontaktiert.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

/**
 * New marketplace message notification
 */
export function newMarketplaceMessage(data: NewMarketplaceMessageData): { subject: string; html: string; text: string } {
  return {
    subject: `Neue Nachricht zu "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, ${data.senderName} hat dir eine Nachricht zu "${data.listingTitle}" geschickt: "${data.messagePreview}" Antworten: ${data.conversationUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Neue Nachricht erhalten</h2>
        <p>Hallo ${data.recipientName},</p>
        <p><strong>${data.senderName}</strong> hat dir eine Nachricht zu deinem Inserat <strong>"${data.listingTitle}"</strong> geschickt:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #374151;">${data.messagePreview}</p>
        </div>
        <p>
          <a href="${data.conversationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Antworten
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

/**
 * New review notification for seller
 */
// ============================================================================
// Order Email Interfaces
// ============================================================================

export interface OrderConfirmationBuyerData extends MarketplaceEmailData {
  listingTitle: string;
  amountChf: string;
  commissionChf: string;
  deliveryMethod: string;
  orderUrl: string;
}

export interface NewOrderNotificationSellerData extends MarketplaceEmailData {
  buyerName: string;
  listingTitle: string;
  payoutAmountChf: string;
  deliveryMethod: string;
  orderUrl: string;
}

export interface OrderStatusUpdateData extends MarketplaceEmailData {
  listingTitle: string;
  newStatusLabel: string;
  actionHint: string;
  orderUrl: string;
}

// ============================================================================
// Order Email Templates
// ============================================================================

/**
 * Order confirmation email for buyer
 */
export function orderConfirmationBuyer(data: OrderConfirmationBuyerData): { subject: string; html: string; text: string } {
  return {
    subject: `Bestellung aufgegeben: "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, deine Bestellung für "${data.listingTitle}" (${data.amountChf}) wurde aufgegeben. Lieferart: ${data.deliveryMethod}. Details: ${data.orderUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bestellung aufgegeben</h2>
        <p>Hallo ${data.recipientName},</p>
        <p>deine Bestellung für <strong>"${data.listingTitle}"</strong> wurde erfolgreich aufgegeben.</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Betrag</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${data.amountChf}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">davon Servicegebühr</td><td style="padding: 4px 0; text-align: right;">${data.commissionChf}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Lieferart</td><td style="padding: 4px 0; text-align: right;">${data.deliveryMethod}</td></tr>
          </table>
        </div>
        <p>
          <a href="${data.orderUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Bestellung ansehen
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Der Verkäufer wurde benachrichtigt und wird sich um den Versand kümmern.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

/**
 * New order notification for seller
 */
export function newOrderNotificationSeller(data: NewOrderNotificationSellerData): { subject: string; html: string; text: string } {
  return {
    subject: `Neue Bestellung: "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, ${data.buyerName} hat "${data.listingTitle}" bestellt. Auszahlung: ${data.payoutAmountChf}. Lieferart: ${data.deliveryMethod}. Details: ${data.orderUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Neue Bestellung erhalten!</h2>
        <p>Hallo ${data.recipientName},</p>
        <p><strong>${data.buyerName}</strong> hat dein Inserat <strong>"${data.listingTitle}"</strong> bestellt.</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Deine Auszahlung</td><td style="padding: 4px 0; text-align: right; font-weight: 600; color: #16a34a;">${data.payoutAmountChf}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Lieferart</td><td style="padding: 4px 0; text-align: right;">${data.deliveryMethod}</td></tr>
          </table>
        </div>
        <p>
          <a href="${data.orderUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Bestellung verwalten
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Bitte versende den Artikel so schnell wie möglich.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

/**
 * Order status update email
 */
export function orderStatusUpdate(data: OrderStatusUpdateData): { subject: string; html: string; text: string } {
  return {
    subject: `Bestellstatus: ${data.newStatusLabel} — "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, der Status deiner Bestellung "${data.listingTitle}" wurde aktualisiert: ${data.newStatusLabel}. ${data.actionHint} Details: ${data.orderUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bestellstatus aktualisiert</h2>
        <p>Hallo ${data.recipientName},</p>
        <p>Der Status deiner Bestellung <strong>"${data.listingTitle}"</strong> wurde aktualisiert:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="font-size: 18px; font-weight: 600; margin: 0;">${data.newStatusLabel}</p>
        </div>
        ${data.actionHint ? `<p style="color: #374151;">${data.actionHint}</p>` : ''}
        <p>
          <a href="${data.orderUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Bestellung ansehen
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

// ============================================================================
// Order Completion / Review Flow Templates
// ============================================================================

export interface OrderReceiptConfirmedData extends MarketplaceEmailData {
  orderNumber: string;
  listingTitle: string;
  orderUrl: string;
}

export interface OrderReviewPromptData extends MarketplaceEmailData {
  listingTitle: string;
  reviewUrl: string;
}

export interface OrderReviewReceivedData extends MarketplaceEmailData {
  listingTitle: string;
  rating: number;
  content: string;
  reviewUrl: string;
}

/**
 * Notify seller that the buyer confirmed receipt of the item.
 */
export function orderReceiptConfirmed(data: OrderReceiptConfirmedData): { subject: string; html: string; text: string } {
  return {
    subject: `Empfang bestätigt: "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, der Käufer hat den Erhalt von "${data.listingTitle}" bestätigt. Die Zahlung wurde freigegeben. Details: ${data.orderUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Der Käufer hat den Erhalt bestätigt</h2>
        <p>Hallo ${data.recipientName},</p>
        <p>Der Käufer hat den Erhalt von <strong>"${data.listingTitle}"</strong> bestätigt. Die Zahlung wurde freigegeben und wird dir in Kürze ausbezahlt.</p>
        <p style="color: #6b7280; font-size: 14px;">Bestellnummer: ${data.orderNumber}</p>
        <p>
          <a href="${data.orderUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Bestellung ansehen
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

/**
 * Thank-you and review prompt sent to buyer after delivery confirmation.
 */
export function orderReviewPrompt(data: OrderReviewPromptData): { subject: string; html: string; text: string } {
  return {
    subject: `Wie war dein Kauf von "${data.listingTitle}"?`,
    text: `Hallo ${data.recipientName}, vielen Dank für deinen Kauf von "${data.listingTitle}". Teile deine Erfahrung mit einer Bewertung: ${data.reviewUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Vielen Dank für deinen Kauf!</h2>
        <p>Hallo ${data.recipientName},</p>
        <p>Wir hoffen, du bist zufrieden mit <strong>"${data.listingTitle}"</strong>. Deine Bewertung hilft anderen Käuferinnen und Käufern bei der Entscheidung und unterstützt verantwortungsvolle Verkäufer.</p>
        <p>
          <a href="${data.reviewUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Jetzt bewerten
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Es dauert nur einen kurzen Moment.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

/**
 * Notify seller that their order received a review.
 */
export function orderReviewReceived(data: OrderReviewReceivedData): { subject: string; html: string; text: string } {
  const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
  return {
    subject: `Neue Bewertung (${data.rating}/5) für "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, du hast eine neue Bewertung für "${data.listingTitle}" erhalten: ${data.rating}/5 Sterne. "${data.content}" Details: ${data.reviewUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Neue Bewertung erhalten</h2>
        <p>Hallo ${data.recipientName},</p>
        <p>Du hast eine neue Bewertung für dein Inserat <strong>"${data.listingTitle}"</strong> erhalten:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="font-size: 24px; margin: 0; color: #f59e0b;">${stars}</p>
          <p style="margin: 8px 0 0; color: #374151; font-weight: 600;">${data.rating} von 5 Sternen</p>
        </div>
        <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #d1d5db; color: #374151;">
          ${data.content}
        </blockquote>
        <p>
          <a href="${data.reviewUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Bewertung ansehen
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}

export function listingReviewNotification(data: ListingReviewData): { subject: string; html: string; text: string } {
  const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
  return {
    subject: `Neue Bewertung für "${data.listingTitle}"`,
    text: `Hallo ${data.recipientName}, ${data.reviewerName} hat dein Inserat "${data.listingTitle}" mit ${data.rating}/5 Sternen bewertet. Ansehen: ${data.reviewUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Neue Bewertung erhalten</h2>
        <p>Hallo ${data.recipientName},</p>
        <p><strong>${data.reviewerName}</strong> hat dein Inserat <strong>"${data.listingTitle}"</strong> bewertet:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="font-size: 24px; margin: 0; color: #f59e0b;">${stars}</p>
          <p style="margin: 8px 0 0; color: #374151; font-weight: 600;">${data.rating} von 5 Sternen</p>
        </div>
        <p>
          <a href="${data.reviewUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Bewertung ansehen
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">RevampIT Marketplace</p>
      </div>
    `,
  };
}
