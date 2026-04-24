/**
 * Tests for marketplace email templates.
 *
 * Pure HTML/text generators for the P2P marketplace flow:
 * listing publication, buyer/seller messages, order flow.
 */

import {
  listingPublishedConfirmation,
  newMarketplaceMessage,
  orderConfirmationBuyer,
  newOrderNotificationSeller,
  orderStatusUpdate,
  orderReceiptConfirmed,
  orderReviewPrompt,
  orderReviewReceived,
  listingReviewNotification,
} from '../templates/marketplace'

const ORDER_URL = 'https://revamp-it.ch/marketplace/orders/123'
const LISTING_URL = 'https://revamp-it.ch/marketplace/listings/456'

// ─── listingPublishedConfirmation ─────────────────────────────────────────────

describe('listingPublishedConfirmation', () => {
  const email = listingPublishedConfirmation({
    recipientName: 'Anna',
    listingTitle: 'ThinkPad T480',
    listingUrl: LISTING_URL,
  })

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains the listing title', () => {
    expect(email.subject).toContain('ThinkPad T480')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Anna')
  })

  it('html contains the listing URL', () => {
    expect(email.html).toContain(LISTING_URL)
  })

  it('text contains the listing URL', () => {
    expect(email.text).toContain(LISTING_URL)
  })
})

// ─── newMarketplaceMessage ────────────────────────────────────────────────────

describe('newMarketplaceMessage', () => {
  const CONVERSATION_URL = 'https://revamp-it.ch/messages/789'
  const email = newMarketplaceMessage({
    recipientName: 'Kai',
    senderName: 'Sara',
    listingTitle: 'Dell Latitude',
    messagePreview: 'Ist der Laptop noch verfügbar?',
    conversationUrl: CONVERSATION_URL,
  })

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the sender name', () => {
    expect(email.html).toContain('Sara')
  })

  it('html contains the message preview', () => {
    expect(email.html).toContain('Ist der Laptop noch verfügbar?')
  })

  it('html contains the conversation URL', () => {
    expect(email.html).toContain(CONVERSATION_URL)
  })

  it('html contains the listing title', () => {
    expect(email.html).toContain('Dell Latitude')
  })
})

// ─── orderConfirmationBuyer ───────────────────────────────────────────────────

describe('orderConfirmationBuyer', () => {
  const email = orderConfirmationBuyer({
    recipientName: 'Lukas',
    listingTitle: 'HP EliteBook 840',
    amountChf: 'CHF 250.00',
    commissionChf: 'CHF 25.00',
    deliveryMethod: 'Versand',
    orderUrl: ORDER_URL,
  })

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains the listing title', () => {
    expect(email.subject).toContain('HP EliteBook 840')
  })

  it('html contains the amount', () => {
    expect(email.html).toContain('CHF 250.00')
  })

  it('html contains the order URL', () => {
    expect(email.html).toContain(ORDER_URL)
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Lukas')
  })

  it('html contains delivery method', () => {
    expect(email.html).toContain('Versand')
  })
})

// ─── newOrderNotificationSeller ───────────────────────────────────────────────

describe('newOrderNotificationSeller', () => {
  const email = newOrderNotificationSeller({
    recipientName: 'Max',
    buyerName: 'Elena',
    listingTitle: 'ASUS ZenBook',
    payoutAmountChf: 'CHF 180.00',
    deliveryMethod: 'Abholung',
    orderUrl: ORDER_URL,
  })

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the buyer name', () => {
    expect(email.html).toContain('Elena')
  })

  it('html contains payout amount', () => {
    expect(email.html).toContain('CHF 180.00')
  })

  it('subject mentions "Bestellung" or "Order"', () => {
    expect(email.subject.toLowerCase()).toMatch(/bestellung|order/)
  })
})

// ─── orderStatusUpdate ────────────────────────────────────────────────────────

describe('orderStatusUpdate', () => {
  const email = orderStatusUpdate({
    recipientName: 'Mia',
    listingTitle: 'Lenovo IdeaPad',
    newStatusLabel: 'Versendet',
    actionHint: 'Bitte überprüfe die Lieferdetails.',
    orderUrl: ORDER_URL,
  })

  it('returns { subject, html, text }', () => {
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('subject contains the new status label', () => {
    expect(email.subject).toContain('Versendet')
  })

  it('html contains the action hint', () => {
    expect(email.html).toContain('Bitte überprüfe die Lieferdetails.')
  })

  it('html contains the name', () => {
    expect(email.html).toContain('Mia')
  })
})

// ─── orderReceiptConfirmed ────────────────────────────────────────────────────

describe('orderReceiptConfirmed', () => {
  // OrderReceiptConfirmedData: { recipientName, orderNumber, listingTitle, orderUrl }
  it('returns { subject, html, text }', () => {
    const email = orderReceiptConfirmed({ recipientName: 'Jonas', orderNumber: 'ORD-123', listingTitle: 'Surface Pro', orderUrl: ORDER_URL })
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the name and listing title', () => {
    const email = orderReceiptConfirmed({ recipientName: 'Jonas', orderNumber: 'ORD-123', listingTitle: 'Surface Pro', orderUrl: ORDER_URL })
    expect(email.html).toContain('Jonas')
    expect(email.html).toContain('Surface Pro')
  })
})

// ─── orderReviewPrompt ────────────────────────────────────────────────────────

describe('orderReviewPrompt', () => {
  // OrderReviewPromptData: { recipientName, listingTitle, reviewUrl }
  const REVIEW_URL = 'https://revamp-it.ch/marketplace/orders/123/review'

  it('returns { subject, html, text }', () => {
    const email = orderReviewPrompt({ recipientName: 'Sophie', listingTitle: 'MacBook Air', reviewUrl: REVIEW_URL })
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains review URL', () => {
    const email = orderReviewPrompt({ recipientName: 'Sophie', listingTitle: 'MacBook Air', reviewUrl: REVIEW_URL })
    expect(email.html).toContain(REVIEW_URL)
  })
})

// ─── orderReviewReceived ──────────────────────────────────────────────────────

describe('orderReviewReceived', () => {
  // OrderReviewReceivedData: { recipientName, listingTitle, rating, content, reviewUrl }
  const REVIEW_URL = 'https://revamp-it.ch/marketplace/orders/123/review'

  it('returns { subject, html, text }', () => {
    const email = orderReviewReceived({ recipientName: 'Tom', listingTitle: 'MacBook Air', rating: 5, content: 'Super!', reviewUrl: REVIEW_URL })
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains the rating', () => {
    const email = orderReviewReceived({ recipientName: 'Tom', listingTitle: 'MacBook Air', rating: 5, content: 'Super!', reviewUrl: REVIEW_URL })
    expect(email.html).toContain('5')
  })
})

// ─── listingReviewNotification ────────────────────────────────────────────────

describe('listingReviewNotification', () => {
  it('returns { subject, html, text }', () => {
    const email = listingReviewNotification({
      recipientName: 'Alice',
      reviewerName: 'Bob',
      rating: 4,
      listingTitle: 'iPad Mini',
      reviewUrl: 'https://revamp-it.ch/marketplace/reviews/99',
    })
    expect(email).toHaveProperty('subject')
    expect(email).toHaveProperty('html')
    expect(email).toHaveProperty('text')
  })

  it('html contains reviewer name', () => {
    const email = listingReviewNotification({
      recipientName: 'Alice',
      reviewerName: 'Bob',
      rating: 4,
      listingTitle: 'iPad Mini',
      reviewUrl: 'https://revamp-it.ch/reviews/99',
    })
    expect(email.html).toContain('Bob')
  })
})
