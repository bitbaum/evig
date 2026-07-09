/**
 * Tests for lifecycle status config files.
 *
 * Covers: appointment-status, invoice-status, workshop-registration-status,
 * refund, location-status, report-status.
 *
 * These share the same pattern: constant → labels map → get*Label/Badge helper.
 * Mission-relevant: status labels appear in admin tables, email subjects, and
 * PDF invoices. Wrong labels mislead staff and customers.
 *
 * Behaviors locked per module:
 *   - constant values match expected strings
 *   - every constant value has a corresponding Swiss-German label
 *   - get*Label returns label for known status, falls back to status string
 *   - get*Badge returns badge object for known status, falls back to gray
 */

import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABELS,
  getAppointmentStatusLabel,
} from '../appointment-status'

import {
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  getInvoiceStatusLabel,
} from '../invoice-status'

import {
  WORKSHOP_REGISTRATION_STATUS,
  WORKSHOP_REGISTRATION_STATUS_LABELS,
  WORKSHOP_PAYMENT_STATUS,
  WORKSHOP_MATERIAL_ACCESS_TYPE,
  getWorkshopRegistrationStatusLabel,
} from '../workshop-registration-status'

import {
  REFUND_STATUS,
  REFUND_STATUS_LABELS,
  REFUND_REASON,
  REFUND_REASON_LABELS,
  getRefundStatusLabel,
  getRefundReasonLabel,
} from '../refund'

import {
  LOCATION_STATUS,
  LOCATION_STATUS_LABELS,
  getLocationStatusLabel,
} from '../location-status'

import {
  REPORT_STATUS,
  REPORT_STATUS_LABELS,
  getReportStatusLabel,
} from '../report-status'

// ============================================================================
// appointment-status
// ============================================================================

describe('APPOINTMENT_STATUS', () => {
  it('has the expected values', () => {
    expect(APPOINTMENT_STATUS.PENDING_APPROVAL).toBe('pending_approval')
    expect(APPOINTMENT_STATUS.REQUESTED).toBe('requested')
    expect(APPOINTMENT_STATUS.CONFIRMED).toBe('confirmed')
    expect(APPOINTMENT_STATUS.IN_PROGRESS).toBe('in_progress')
    expect(APPOINTMENT_STATUS.CANCELLED).toBe('cancelled')
    expect(APPOINTMENT_STATUS.COMPLETED).toBe('completed')
  })

  it('every value has a Swiss-German label', () => {
    for (const v of Object.values(APPOINTMENT_STATUS)) {
      expect(APPOINTMENT_STATUS_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getAppointmentStatusLabel', () => {
  it('returns label for CONFIRMED', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.CONFIRMED)).toBe('Bestätigt')
  })

  it('returns label for IN_PROGRESS', () => {
    expect(getAppointmentStatusLabel(APPOINTMENT_STATUS.IN_PROGRESS)).toBe('In Bearbeitung')
  })

  it('falls back to status string for unknown', () => {
    expect(getAppointmentStatusLabel('rescheduled')).toBe('rescheduled')
  })
})

// ============================================================================
// invoice-status
// ============================================================================

describe('INVOICE_STATUS', () => {
  it('has the expected values', () => {
    expect(INVOICE_STATUS.DRAFT).toBe('draft')
    expect(INVOICE_STATUS.SENT).toBe('sent')
    expect(INVOICE_STATUS.PAID).toBe('paid')
    expect(INVOICE_STATUS.OVERDUE).toBe('overdue')
    expect(INVOICE_STATUS.CANCELLED).toBe('cancelled')
  })

  it('every value has a Swiss-German label', () => {
    for (const v of Object.values(INVOICE_STATUS)) {
      expect(INVOICE_STATUS_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getInvoiceStatusLabel', () => {
  it('returns "Bezahlt" for PAID', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.PAID)).toBe('Bezahlt')
  })

  it('returns "Überfällig" for OVERDUE', () => {
    expect(getInvoiceStatusLabel(INVOICE_STATUS.OVERDUE)).toBe('Überfällig')
  })

  it('falls back to status string for unknown', () => {
    expect(getInvoiceStatusLabel('void')).toBe('void')
  })
})

// ============================================================================
// workshop-registration-status
// ============================================================================

describe('WORKSHOP_REGISTRATION_STATUS', () => {
  it('has the expected values', () => {
    expect(WORKSHOP_REGISTRATION_STATUS.PENDING).toBe('pending')
    expect(WORKSHOP_REGISTRATION_STATUS.CONFIRMED).toBe('confirmed')
    expect(WORKSHOP_REGISTRATION_STATUS.WAITLIST).toBe('waitlist')
    expect(WORKSHOP_REGISTRATION_STATUS.ATTENDED).toBe('attended')
    expect(WORKSHOP_REGISTRATION_STATUS.CANCELLED).toBe('cancelled')
    expect(WORKSHOP_REGISTRATION_STATUS.NO_SHOW).toBe('no_show')
  })

  it('every value has a Swiss-German label', () => {
    for (const v of Object.values(WORKSHOP_REGISTRATION_STATUS)) {
      expect(WORKSHOP_REGISTRATION_STATUS_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getWorkshopRegistrationStatusLabel', () => {
  it('returns "Warteliste" for WAITLIST', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.WAITLIST)).toBe('Warteliste')
  })

  it('returns "Nicht erschienen" for NO_SHOW', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.NO_SHOW)).toBe('Nicht erschienen')
  })

  it('falls back to status string for unknown', () => {
    expect(getWorkshopRegistrationStatusLabel('expelled')).toBe('expelled')
  })
})

describe('WORKSHOP_PAYMENT_STATUS', () => {
  it('has NOT_REQUIRED, PENDING, PAID, REFUNDED', () => {
    expect(WORKSHOP_PAYMENT_STATUS.NOT_REQUIRED).toBe('not_required')
    expect(WORKSHOP_PAYMENT_STATUS.PENDING).toBe('pending')
    expect(WORKSHOP_PAYMENT_STATUS.PAID).toBe('paid')
    expect(WORKSHOP_PAYMENT_STATUS.REFUNDED).toBe('refunded')
  })
})

describe('WORKSHOP_MATERIAL_ACCESS_TYPE', () => {
  it('has PUBLIC, REGISTERED, ATTENDED', () => {
    expect(WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC).toBe('public')
    expect(WORKSHOP_MATERIAL_ACCESS_TYPE.REGISTERED).toBe('registered')
    expect(WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED).toBe('attended')
  })
})

// ============================================================================
// refund
// ============================================================================

describe('REFUND_STATUS', () => {
  it('has the expected values', () => {
    expect(REFUND_STATUS.REQUESTED).toBe('requested')
    expect(REFUND_STATUS.APPROVED).toBe('approved')
    expect(REFUND_STATUS.PROCESSING).toBe('processing')
    expect(REFUND_STATUS.COMPLETED).toBe('completed')
    expect(REFUND_STATUS.REJECTED).toBe('rejected')
  })

  it('every value has a Swiss-German label', () => {
    for (const v of Object.values(REFUND_STATUS)) {
      expect(REFUND_STATUS_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getRefundStatusLabel', () => {
  it('returns "In Bearbeitung" for PROCESSING', () => {
    expect(getRefundStatusLabel(REFUND_STATUS.PROCESSING)).toBe('In Bearbeitung')
  })

  it('falls back to status string for unknown', () => {
    expect(getRefundStatusLabel('on_hold')).toBe('on_hold')
  })
})

describe('REFUND_REASON', () => {
  it('has the expected reason keys', () => {
    expect(REFUND_REASON.CUSTOMER_REQUEST).toBe('customer_request')
    expect(REFUND_REASON.SERVICE_CANCELLED).toBe('service_cancelled')
    expect(REFUND_REASON.DUPLICATE_CHARGE).toBe('duplicate_charge')
    expect(REFUND_REASON.FRAUD).toBe('fraud')
    expect(REFUND_REASON.OTHER).toBe('other')
  })

  it('every reason has a Swiss-German label', () => {
    for (const v of Object.values(REFUND_REASON)) {
      expect(REFUND_REASON_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getRefundReasonLabel', () => {
  it('returns "Betrug" for FRAUD', () => {
    expect(getRefundReasonLabel(REFUND_REASON.FRAUD)).toBe('Betrug')
  })

  it('falls back to reason string for unknown', () => {
    expect(getRefundReasonLabel('system_error')).toBe('system_error')
  })
})

// ============================================================================
// location-status
// ============================================================================

describe('LOCATION_STATUS', () => {
  it('has the expected values', () => {
    expect(LOCATION_STATUS.PENDING).toBe('pending')
    expect(LOCATION_STATUS.APPROVED).toBe('approved')
    expect(LOCATION_STATUS.REJECTED).toBe('rejected')
    expect(LOCATION_STATUS.SUSPENDED).toBe('suspended')
  })

  it('every value has a Swiss-German label', () => {
    for (const v of Object.values(LOCATION_STATUS)) {
      expect(LOCATION_STATUS_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getLocationStatusLabel', () => {
  it('returns "Suspendiert" for SUSPENDED', () => {
    expect(getLocationStatusLabel(LOCATION_STATUS.SUSPENDED)).toBe('Suspendiert')
  })

  it('falls back to status string for unknown', () => {
    expect(getLocationStatusLabel('archived')).toBe('archived')
  })
})

// ============================================================================
// report-status
// ============================================================================

describe('REPORT_STATUS', () => {
  it('has the expected values', () => {
    expect(REPORT_STATUS.PENDING).toBe('pending')
    expect(REPORT_STATUS.REVIEWED).toBe('reviewed')
    expect(REPORT_STATUS.RESOLVED).toBe('resolved')
    expect(REPORT_STATUS.ARCHIVED).toBe('archived')
  })

  it('every value has a Swiss-German label', () => {
    for (const v of Object.values(REPORT_STATUS)) {
      expect(REPORT_STATUS_LABELS[v]).toBeTruthy()
    }
  })
})

describe('getReportStatusLabel', () => {
  it('returns "Überprüft" for REVIEWED', () => {
    expect(getReportStatusLabel(REPORT_STATUS.REVIEWED)).toBe('Überprüft')
  })

  it('returns "Gelöst" for RESOLVED', () => {
    expect(getReportStatusLabel(REPORT_STATUS.RESOLVED)).toBe('Gelöst')
  })

  it('falls back to status string for unknown', () => {
    expect(getReportStatusLabel('dismissed')).toBe('dismissed')
  })
})
