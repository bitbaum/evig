# Community Pages Testing Checklist

## Prerequisites
- [ ] Application is running (`npm run dev`)
- [ ] Database is up and contains test data
- [ ] You have a test account to log in with

---

## 1. IT-Hilfe Page Tests

### 1.1 Search Functionality
- [ ] Visit `/it-hilfe`
- [ ] Enter "Laptop" in search box
- [ ] Press Enter or submit
- [ ] **Expected:** Results filter to show only laptop-related requests
- [ ] Clear search
- [ ] **Expected:** All results return

### 1.2 Sort Functionality
- [ ] Click "Filter" button to expand filters
- [ ] Change sort to "Neueste zuerst"
- [ ] **Expected:** Most recent requests appear first
- [ ] Change to "Dringlichste zuerst"
- [ ] **Expected:** Urgent requests appear first
- [ ] Change to "Höchstes Budget"
- [ ] **Expected:** Requests with highest budget appear first

### 1.3 Category Filter
- [ ] Select "Laptop" from category dropdown
- [ ] **Expected:** Only laptop requests shown
- [ ] **Expected:** Filter count updates (e.g., "5 Anfragen gefunden")

### 1.4 Canton Filter
- [ ] Select "Zürich" from canton dropdown
- [ ] **Expected:** Only requests from Zürich shown

### 1.5 Urgency Filter
- [ ] Select "Dringend" from urgency dropdown
- [ ] **Expected:** Only urgent requests shown

### 1.6 Combined Filters
- [ ] Apply category + canton + urgency filters together
- [ ] **Expected:** Results match ALL criteria
- [ ] Click "Filter zurücksetzen"
- [ ] **Expected:** All filters clear, all results return

### 1.7 Pagination
- [ ] If results > 20, verify pagination controls appear
- [ ] Click "Weiter →"
- [ ] **Expected:** Page 2 loads, different results shown
- [ ] **Expected:** "← Zurück" button becomes enabled
- [ ] Click "← Zurück"
- [ ] **Expected:** Return to page 1

### 1.8 Error Handling
- [ ] Open browser DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Refresh page
- [ ] **Expected:** Error message appears: "Fehler beim Laden der Anfragen"
- [ ] **Expected:** "Erneut versuchen" button visible
- [ ] Re-enable network
- [ ] Click "Erneut versuchen"
- [ ] **Expected:** Data loads successfully

### 1.9 Loading States
- [ ] Refresh page
- [ ] **Expected:** Skeleton loaders appear (gray boxes)
- [ ] **Expected:** Skeletons match grid layout
- [ ] **Expected:** Smooth transition to actual content

### 1.10 Empty State
- [ ] Search for "xyzabc123nonexistent"
- [ ] **Expected:** Empty state message appears
- [ ] **Expected:** Helpful message like "Keine Anfragen gefunden"

---

## 2. Marketplace Page Tests

### 2.1 Search with Debouncing
- [ ] Visit `/marketplace`
- [ ] Open browser DevTools → Network tab
- [ ] Type "iPhone" quickly (6 keystrokes in <1 second)
- [ ] **Expected:** Only 1-2 API calls to `/api/listings` (not 6)
- [ ] Wait for results
- [ ] **Expected:** Results show iPhone-related items

### 2.2 Price Validation - Negative Price
- [ ] Click "Filter" to expand
- [ ] Enter `-100` in Min price field
- [ ] Click outside the field (blur)
- [ ] **Expected:** Red border appears on input
- [ ] **Expected:** Error message: "Preis kann nicht negativ sein"
- [ ] **Expected:** No API call made

### 2.3 Price Validation - Min > Max
- [ ] Enter `1000` in Min price
- [ ] Enter `500` in Max price
- [ ] Click outside
- [ ] **Expected:** Error message: "Mindestpreis darf nicht höher als Höchstpreis sein"

### 2.4 Price Validation - Exceeds Maximum
- [ ] Enter `60000` in Min price
- [ ] Click outside
- [ ] **Expected:** Error message: "Preis darf maximal CHF 50'000 sein"

### 2.5 Price Validation - Valid Range
- [ ] Clear price fields
- [ ] Enter `100` in Min
- [ ] Enter `500` in Max
- [ ] Click outside
- [ ] **Expected:** No error message
- [ ] **Expected:** Red border clears
- [ ] **Expected:** Results filter to price range

### 2.6 Category Filter
- [ ] Select a category (e.g., "Laptops")
- [ ] **Expected:** Results filter to that category

### 2.7 Condition Filter
- [ ] Select "Neu" from condition dropdown
- [ ] **Expected:** Only new items shown

### 2.8 Delivery Filter
- [ ] Select "Versand" from delivery options
- [ ] **Expected:** Only items with shipping shown

### 2.9 Combined Filters
- [ ] Apply category + condition + price range
- [ ] **Expected:** Results match all criteria
- [ ] Click clear/reset filters
- [ ] **Expected:** All filters reset

### 2.10 Loading States
- [ ] Refresh page
- [ ] **Expected:** Skeleton loaders in grid layout
- [ ] **Expected:** Each skeleton has image placeholder + text lines

### 2.11 Error Handling
- [ ] Set network to offline
- [ ] Refresh page
- [ ] **Expected:** Error message appears
- [ ] **Expected:** Retry functionality available

---

## 3. Security Tests

### 3.1 XSS Prevention (Requires Login)
- [ ] Log in to account
- [ ] Visit `/it-hilfe/create`
- [ ] Enter title: `<script>alert('xss')</script>Laptop Hilfe`
- [ ] Enter valid description and other fields
- [ ] Submit form
- [ ] **Expected:** Request created successfully
- [ ] View the created request
- [ ] **Expected:** Script tag is stripped or escaped
- [ ] **Expected:** No JavaScript alert appears
- [ ] **Expected:** Title shows as "Laptop Hilfe" or similar

### 3.2 Input Validation - Postal Code
- [ ] Visit `/it-hilfe/create`
- [ ] Enter postal code: `123` (3 digits)
- [ ] Try to submit
- [ ] **Expected:** Validation error
- [ ] Enter postal code: `ABCD` (letters)
- [ ] **Expected:** Validation error
- [ ] Enter postal code: `8055` (valid)
- [ ] **Expected:** No error

### 3.3 Rate Limiting (Requires Login)
⚠️ **Warning:** This will temporarily block your account

- [ ] Log in to test account
- [ ] Create 5 IT-Hilfe requests rapidly (fill minimum fields)
- [ ] **Expected:** All 5 succeed
- [ ] Try to create 6th request immediately
- [ ] **Expected:** Error: "Zu viele Anfragen. Bitte warte 1 Stunde."
- [ ] **Expected:** Request is NOT created
- [ ] Wait 5 minutes or use different account

### 3.4 Zod Schema Validation
- [ ] Try to create IT-Hilfe request with:
  - [ ] Title < 10 characters → Error
  - [ ] Description < 20 characters → Error
  - [ ] Invalid canton → Error
  - [ ] Budget > CHF 1000 → Error
- [ ] **Expected:** Descriptive error messages for each

---

## 4. Mobile Responsiveness

### 4.1 Mobile Viewport (375px)
- [ ] Open DevTools → Toggle device toolbar
- [ ] Set to iPhone SE (375px width)
- [ ] Visit `/it-hilfe`
- [ ] **Expected:** Hero section stacks vertically
- [ ] **Expected:** Search bar is full width
- [ ] **Expected:** Filter button is visible and accessible
- [ ] Click filter button
- [ ] **Expected:** Filters expand smoothly
- [ ] **Expected:** All filter dropdowns are readable

### 4.2 Touch Targets
- [ ] Verify all buttons are at least 44x44px
- [ ] Test tapping filter button
- [ ] Test tapping sort dropdown
- [ ] Test tapping pagination buttons
- [ ] **Expected:** All elements easy to tap, no mis-taps

### 4.3 Tablet Viewport (768px)
- [ ] Set to iPad (768px)
- [ ] Visit `/marketplace`
- [ ] **Expected:** Grid shows 2-3 items per row
- [ ] **Expected:** Filters remain accessible

---

## 5. Cross-Browser Testing

### 5.1 Chrome
- [ ] Run all tests above in Chrome
- [ ] Note any issues

### 5.2 Firefox
- [ ] Run critical tests in Firefox
- [ ] Verify price validation works
- [ ] Verify debounced search works

### 5.3 Safari (if available)
- [ ] Test on Safari/iOS
- [ ] Verify forms work
- [ ] Verify filters work

---

## 6. Performance Tests

### 6.1 Loading Time
- [ ] Open DevTools → Network tab
- [ ] Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] Check "DOMContentLoaded" time
- [ ] **Expected:** < 2 seconds on good connection
- [ ] Check total page load
- [ ] **Expected:** < 3 seconds

### 6.2 Debounce Verification
- [ ] Open Console
- [ ] Type quickly in Marketplace search (10 characters in 1 second)
- [ ] Count API requests in Network tab
- [ ] **Expected:** Maximum 1-2 requests (not 10)

---

## Results Documentation

### Issues Found
| Test | Status | Issue | Severity |
|------|--------|-------|----------|
| Example | ❌ | Search doesn't filter | High |
| Example | ✅ | Works correctly | - |

### Browser Compatibility
| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | - | - | - |
| Firefox | - | - | - |
| Safari | - | - | - |

### Performance Metrics
| Metric | Value | Target | Pass |
|--------|-------|--------|------|
| IT-Hilfe Load Time | - | <2s | - |
| Marketplace Load Time | - | <2s | - |
| API Response Time | - | <500ms | - |

---

## Sign-off

- [ ] All critical tests pass (Search, Filter, Sort, Pagination)
- [ ] All security tests pass (XSS, Rate Limit, Validation)
- [ ] Mobile responsive on 375px and 768px
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Ready for production deployment

**Tested by:** _______________
**Date:** _______________
**Environment:** _______________
