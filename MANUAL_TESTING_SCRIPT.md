# Manual Testing Script - Community Pages
## Step-by-Step Browser Testing Guide

**Estimated Time:** 30 minutes
**Prerequisites:**
- Application running (`npm run dev` or production URL)
- Test account credentials
- Chrome DevTools open (F12)

---

## 🚀 **CRITICAL WORKFLOWS (P0 - Must Test)**

### **Test 1: XSS Prevention** ⏱️ 5 min

**Goal:** Verify script tags are sanitized

1. **Setup:**
   - Open DevTools → Console tab
   - Clear console
   - Navigate to: `/it-hilfe/create`

2. **Test XSS in Title:**
   ```
   Title: <script>alert('XSS')</script>Laptop Reparatur gesucht
   Description: Mein Laptop funktioniert nicht mehr
   Postal Code: 8055
   City: Zürich
   Canton: Zürich
   Category: Laptop
   ```

3. **Submit form**

4. **Expected Results:**
   - ✅ Form submits successfully
   - ✅ NO JavaScript alert appears
   - ✅ Request is created
   - ✅ When viewing the request, title shows "Laptop Reparatur gesucht" (script tag removed)
   - ❌ If alert appears → **CRITICAL BUG - XSS vulnerability**

5. **Check Database:**
   ```sql
   SELECT title FROM it_hilfe_requests ORDER BY created_at DESC LIMIT 1;
   ```
   - ✅ Should NOT contain `<script>` tag

**Status:** [ ] Pass [ ] Fail

---

### **Test 2: Rate Limiting** ⏱️ 10 min

**Goal:** Verify rate limiting prevents spam

1. **Setup:**
   - Log in with test account
   - Navigate to: `/it-hilfe/create`
   - Open DevTools → Network tab

2. **Create 5 requests rapidly:**
   - Fill minimum required fields
   - Submit request 1 → ✅ Should succeed
   - Submit request 2 → ✅ Should succeed
   - Submit request 3 → ✅ Should succeed
   - Submit request 4 → ✅ Should succeed
   - Submit request 5 → ✅ Should succeed

3. **Attempt 6th request:**
   - Submit request 6 immediately

4. **Expected Results:**
   - ❌ Request 6 should FAIL
   - ✅ Error message: "Zu viele Anfragen. Bitte warte 1 Stunde."
   - ✅ HTTP status: 400 (Bad Request)
   - ✅ No request created in database

5. **Verify in Network tab:**
   - Check response for 6th request
   - Should see `{ success: false, error: "Zu viele Anfragen..." }`

6. **Wait 5 minutes and try again:**
   - Should still be blocked (1 hour limit)

**Status:** [ ] Pass [ ] Fail

---

### **Test 3: Input Validation** ⏱️ 5 min

**Goal:** Verify Zod schema validation

1. **Navigate to:** `/it-hilfe/create`

2. **Test Invalid Postal Code:**
   - Enter: `123` (3 digits)
   - Try to submit
   - ✅ Should show error: "Postleitzahl muss 4 Ziffern haben"

3. **Test Invalid Postal Code (Letters):**
   - Enter: `ABCD`
   - ✅ Should show validation error or reject input

4. **Test Valid Postal Code:**
   - Enter: `8055`
   - ✅ Should accept without error

5. **Test Short Title:**
   - Title: `Laptop` (6 chars)
   - ✅ Should show: "Titel muss mindestens 10 Zeichen lang sein"

6. **Test Short Description:**
   - Description: `Broken` (6 chars)
   - ✅ Should show: "Beschreibung muss mindestens 20 Zeichen lang sein"

**Status:** [ ] Pass [ ] Fail

---

## 🎨 **UX WORKFLOWS (P1 - Should Test)**

### **Test 4: Price Validation (Marketplace)** ⏱️ 5 min

1. **Navigate to:** `/marketplace`

2. **Open Filters**

3. **Test Negative Price:**
   - Min price: `-100`
   - Click outside field
   - ✅ Should show red border
   - ✅ Should show error: "Preis kann nicht negativ sein"
   - ✅ Should NOT make API call

4. **Test Min > Max:**
   - Min: `1000`
   - Max: `500`
   - Click outside
   - ✅ Should show error: "Mindestpreis darf nicht höher als Höchstpreis sein"

5. **Test Exceeds Maximum:**
   - Min: `60000`
   - ✅ Should show error: "Preis darf maximal CHF 50'000 sein"

6. **Test Valid Range:**
   - Min: `100`
   - Max: `500`
   - ✅ Error clears
   - ✅ Red border disappears
   - ✅ API call made
   - ✅ Results filtered

**Status:** [ ] Pass [ ] Fail

---

### **Test 5: Search Debouncing (Marketplace)** ⏱️ 3 min

1. **Navigate to:** `/marketplace`

2. **Open DevTools → Network tab**

3. **Clear network log**

4. **Type quickly:** `iPhone` (6 characters in < 1 second)

5. **Observe Network tab:**
   - Count requests to `/api/listings`
   - ✅ Should see only 1-2 requests (NOT 6)
   - ✅ Last request should be ~300ms after last keystroke

6. **Check results:**
   - ✅ Should show iPhone-related items

**Status:** [ ] Pass [ ] Fail
**API Calls Made:** _____

---

### **Test 6: Search Functionality (IT-Hilfe)** ⏱️ 3 min

1. **Navigate to:** `/it-hilfe`

2. **Enter search:** `Laptop`

3. **Press Enter or Submit**

4. **Expected:**
   - ✅ Results filter to laptop-related requests
   - ✅ URL updates with `?search=Laptop`
   - ✅ Count updates (e.g., "5 Anfragen gefunden")

5. **Clear search:**
   - Delete text, press Enter
   - ✅ All results return

**Status:** [ ] Pass [ ] Fail

---

### **Test 7: Sort Options (IT-Hilfe)** ⏱️ 3 min

1. **Navigate to:** `/it-hilfe`

2. **Click "Filter" button**

3. **Test each sort option:**

   a) **Neueste zuerst:**
   - Select from dropdown
   - ✅ Most recent requests appear first
   - Check dates are descending

   b) **Dringlichste zuerst:**
   - Select from dropdown
   - ✅ "Dringend" requests appear at top

   c) **Höchstes Budget:**
   - Select from dropdown
   - ✅ Requests with highest budget first

   d) **Meiste Angebote:**
   - Select from dropdown
   - ✅ Requests with most offers first

**Status:** [ ] Pass [ ] Fail

---

### **Test 8: Pagination** ⏱️ 2 min

**IT-Hilfe:**
1. Navigate to `/it-hilfe`
2. If > 20 results exist:
   - ✅ Pagination controls visible
   - ✅ Shows "Seite 1 von X"
3. Click "Weiter →"
   - ✅ Page 2 loads
   - ✅ Different results shown
   - ✅ "← Zurück" enabled
4. Click "← Zurück"
   - ✅ Return to page 1

**Marketplace:**
1. Navigate to `/marketplace`
2. Same tests as above

**Status:** [ ] Pass [ ] Fail

---

### **Test 9: Filters (IT-Hilfe)** ⏱️ 3 min

1. **Navigate to:** `/it-hilfe`

2. **Click "Filter"**

3. **Test Category Filter:**
   - Select: "Laptop"
   - ✅ Only laptop requests shown

4. **Test Canton Filter:**
   - Select: "Zürich"
   - ✅ Only Zürich requests shown

5. **Test Combined Filters:**
   - Category: "Laptop"
   - Canton: "Zürich"
   - Urgency: "Dringend"
   - ✅ Results match ALL criteria

6. **Clear Filters:**
   - Click "Filter zurücksetzen"
   - ✅ All filters reset to empty
   - ✅ All results return

**Status:** [ ] Pass [ ] Fail

---

### **Test 10: Loading States** ⏱️ 2 min

1. **Navigate to:** `/marketplace`

2. **Open DevTools → Network tab**

3. **Throttle to "Slow 3G"**

4. **Refresh page**

5. **Observe:**
   - ✅ Skeleton loaders appear (gray boxes)
   - ✅ Skeletons match grid layout
   - ✅ Smooth transition to actual content
   - ✅ No loading spinners (should use skeletons)

6. **Reset throttling**

**Status:** [ ] Pass [ ] Fail

---

### **Test 11: Error Handling** ⏱️ 2 min

1. **Navigate to:** `/it-hilfe`

2. **Open DevTools → Network tab**

3. **Set to "Offline"**

4. **Refresh page**

5. **Expected:**
   - ✅ Error message appears
   - ✅ Shows: "Fehler beim Laden der Anfragen"
   - ✅ "Erneut versuchen" button visible

6. **Re-enable network**

7. **Click "Erneut versuchen"**
   - ✅ Data loads successfully

**Status:** [ ] Pass [ ] Fail

---

## 📱 **MOBILE TESTING (P2 - Nice to Have)**

### **Test 12: Mobile Responsiveness** ⏱️ 5 min

1. **Open DevTools → Device Toolbar (Cmd+Shift+M)**

2. **Set to iPhone SE (375px)**

3. **Test IT-Hilfe:**
   - ✅ Hero section stacks vertically
   - ✅ Search bar full width
   - ✅ Filter button accessible
   - ✅ Filters expand properly
   - ✅ Buttons ≥44px (tappable)

4. **Test Marketplace:**
   - ✅ Price inputs readable
   - ✅ Validation errors visible
   - ✅ Filter panel usable

5. **Set to iPad (768px)**
   - ✅ Grid shows 2-3 items per row
   - ✅ Layout looks good

**Status:** [ ] Pass [ ] Fail

---

## 📊 **RESULTS SUMMARY**

### Critical Tests (P0):
- [ ] XSS Prevention: __________
- [ ] Rate Limiting: __________
- [ ] Input Validation: __________

### UX Tests (P1):
- [ ] Price Validation: __________
- [ ] Search Debouncing: __________
- [ ] Search Functionality: __________
- [ ] Sort Options: __________
- [ ] Pagination: __________
- [ ] Filters: __________
- [ ] Loading States: __________
- [ ] Error Handling: __________

### Mobile Tests (P2):
- [ ] Mobile Responsiveness: __________

---

## 🐛 **BUGS FOUND**

| Test | Issue | Severity | Details |
|------|-------|----------|---------|
| | | | |
| | | | |

---

## ✅ **FINAL VERDICT**

- [ ] **ALL P0 TESTS PASS** → Deploy to production
- [ ] **P0 FAILURES** → Fix before deploying
- [ ] **P1 FAILURES** → Deploy but log issues
- [ ] **P2 FAILURES** → Deploy, fix later

**Tested by:** _______________
**Date:** _______________
**Environment:** _______________
**Overall Status:** _______________
