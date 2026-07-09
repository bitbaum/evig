# Emails & Notifications — SSOT

**What gets an email/notification, when, and to whom.** Keep this in sync when you add or change any `createNotification` / `notifyUsers` / `notifyAllStaff` / `sendCustomEmail` call.

Last updated: 2026-07-09.

---

## How it works — two dispatch paths

**Path A — Notification system** (`src/lib/services/notifications.ts`)
`createNotification(userId, payload, opts?)` · `notifyUsers(userIds, payload)` · `notifyAllStaff(payload, excludeUserId?)` each write an **in-app notification row** (the bell) **and** send an email via `trySendEmail` to every recipient whose `user_profiles.email_notifications !== false` (default true).
- Email body: `getEmailContent(payload)` uses a **dedicated template** for `decision_*`, `it_hilfe_*` (when `metadata.requestUrl` set), and `content_submission_status` (when `metadata.action` set); **everything else falls back to the generic `notificationEmail(title, content)`**.
- **`opts.skipEmail: true`** → in-app row only, no email. Use when a dedicated styled email is already sent for the event via Path B (avoids a second generic email, and still gives a bell entry that survives email-deliverability drops).

**Path B — Direct email** (`sendCustomEmail` / `sendEmail`)
Inline from routes. **No in-app row**, always a **dedicated template**. Used by marketplace orders, listing publish/question, appointments, workshops, HR, IT-Hilfe admin alerts.

Central dispatcher for workflow events (timecards, time-off, permissions): `src/lib/lifecycle/dispatch.ts`.

**Recipient resolution helpers:** `getTimecardApproverIds(excludeUserId?)` (staff with `timecards`/`*` permission or super-admin), `notifyAllStaff`, `resolveEligibleUserIds` (decisions).

---

## Deliverability caveat (READ THIS)

Prod sends via **Brevo**. If the `revampit.ch` sending domain isn't SPF/DKIM-authenticated, Brevo **accepts + queues** the mail but Gmail/consumer mailboxes **silently drop it**. So an email being "sent" ≠ delivered.
- **Most at risk — external recipients:** IT-Hilfe requesters + community technicians, marketplace buyers + P2P sellers, job applicants, workshop registrants, service-appointment customers, paying members.
- **Lower risk — internal `@revamp-it.ch`:** all staff-facing notifications (timecards, time-off, decisions, tasks, admin alerts).
- **Mitigation in code:** prefer an **in-app notification** (Path A, bell) for anything the user must not miss, so it lands regardless of email. The DNS fix (authenticate `revampit.ch` in Brevo + SPF/DKIM/DMARC records) is a separate ops task and is the real fix for external delivery.

---

## Trigger table

Legend: **A** = notification system (in-app + maybe email) · **B** = direct email only · **A(skipEmail)** = in-app only.

| Event | Path | Recipients | Emails? |
|---|---|---|---|
| **Decisions** | | | |
| Voting opens | A | eligible voters − opener | ✓ |
| Decision closed (manual / cron) | A | creator / all staff | ✓ |
| Voting deadline ~24h | A | non-voters | ✓ |
| **Protocols** | | | |
| Protocol finalized | A | attendees | ✓ (generic) |
| **IT-Hilfe** | | | |
| Request created → requester | A | requester | ✓ |
| Request created → admin alert | B | shared inbox | ✓ |
| Request created → preferred / matching techs | A | preferred + skill-matched active techs | ✓ |
| New offer | A | request owner | ✓ |
| Offer accepted / rejected / declined | A | the helper(s) | ✓ |
| Request completed / review received | A | requester / reviewed helper | ✓ |
| **Marketplace** | | | |
| Order placed → buyer | B | buyer | ✓ |
| **Order placed → seller** | **B + A(skipEmail)** | seller (styled email **+ bell entry**) | ✓ |
| Cart paid (webhook) | B | buyer + seller | ✓ |
| Listing published | B | seller | ✓ |
| Question / receipt-confirmed / review | A + B | seller (⚠ double email, see follow-ups) | ✓✓ |
| **Membership** | | | |
| Payment recorded | A | the member | ✓ (generic) |
| **Workshops** | | | |
| Free registration | B + A | registrant (email) + all staff (in-app) | ✓ |
| Proposal approved | A | proposer | ✓ |
| **Service appointments** | | | |
| Booking → admins | A + B | all staff + shared inbox (if unassigned) | ✓ |
| Booking → assigned repairer | A | the repairer | ✓ |
| **Booking → customer** | **A** | the customer (in-app + generic email) | ✓ |
| Quote/accept/reject/start/complete | B | customer / repairer | ✓ |
| Completed → staff | A | all staff − actor | ✓ |
| **Timecards** | | | |
| Submitted → other approvers | A | approvers − submitter | ✓ |
| **Submitted → submitter** | **A** (`timecard_submit_confirmed`) | the submitter (also "you can approve it yourself" when sole approver) | ✓ |
| Approved / rejected / reopened / edited | A | card owner | ✓ |
| **Time-off** | | | |
| Submitted → approvers | A | approvers | ✓ |
| Reviewed → requester | A | requester | ✓ |
| **Permissions** | | | |
| Access requested / reviewed | A | super admins / requester | ✓ |
| **HR** | | | |
| Application → staff / applicant | A + B | all staff (in-app) + applicant (email) | ✓ |
| Status changed | A/B | applicant | ✓ |
| **Blog** | | | |
| Status change | A + B | submitter | ✓ |
| **Tasks** | | | |
| Assigned / requested / completed / accepted / recurring | A | assignee / requester / creator / staff | ✓ |

---

## Fixed 2026-07-09 (commit trail in git)

- **Timecard submitted → submitter now gets a confirmation** (`timecard_submit_confirmed`), and when the submitter is the **sole approver** it also tells them they can approve it themselves. Previously the submitter got nothing, and a sole-super-admin approver submitting their own card notified **nobody** (`getTimecardApproverIds` excludes the submitter). — `src/lib/services/timecards.ts`
- **Order placed → seller now gets an in-app bell entry** (`listing_sold`, `skipEmail` so no duplicate of the styled email). Robust against email drops. New `RELATED_TYPES.ORDER` → `/dashboard/orders/`. — `src/app/api/marketplace/orders/route.ts`
- **Service booking → customer now acknowledged** (in-app + generic email) at booking time. Previously only admins + the assigned repairer were notified. — `src/app/api/appointments/route.ts`
- **`createNotification` gained `opts.skipEmail`** for in-app-only notifications.

## Known follow-ups (NOT yet done)

1. **Paid workshop registration (webhook) sends no confirmation** — `src/lib/services/payment-webhook.ts:451` only logs. Fix: send `workshopRegistrationConfirmation` on payment success. *(Deferred: the Payrexx-paid path isn't live/testable yet.)*
2. **Paid service appointment (webhook) sends no confirmation** — `payment-webhook.ts:457` only logs. Same deferral.
3. **Marketplace double emails** — question / confirm-receipt / review each fire a `marketplace`-type `createNotification` (→ generic email) **and** a dedicated `sendCustomEmail`, so the seller gets two emails per event. Fix: pass `{ skipEmail: true }` to those `createNotification` calls (now supported) to keep only the styled email.
4. **Time-off request → requester gets no acknowledgement** (only notified later on review). Mirror the timecard-submit confirmation for consistency.
5. **SSOT drift:** `src/app/api/tasks/route.ts` + `tasks/[id]/route.ts` emit the literal `'task_assigned'`, which isn't in `NOTIFICATION_TYPES`. Add the constant and use it.
6. **Dead notification types** (defined, no producer): `message`, `appointment` (now used), `vacancy_published`, `marketing`, `task_broadcast`. Prune or wire.
7. **Deliverability:** authenticate `revampit.ch` in Brevo (SPF/DKIM/DMARC) so external emails actually land.
