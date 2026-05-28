# Phase 3: E2E Testing Plan

**Created**: 2025-12-17  
**Last Modified**: 2025-12-17  
**Last Modified Summary**: Comprehensive E2E testing plan for product listing integration

## Overview

This document outlines the end-to-end testing plan for verifying that the product listing system works correctly from form submission through database storage.

## Test Scenarios

### 1. Image Upload Flow

**Test Case**: TC-IMG-001  
**Description**: Upload single image  
**Steps**:
1. Select one image file (< 10MB, valid image format)
2. Submit upload
3. Verify response contains `{ ok: true, urls: [...] }`
4. Verify URL is accessible

**Expected Result**: Image uploaded successfully, URL returned

**Test Case**: TC-IMG-002  
**Description**: Upload multiple images (max 5)  
**Steps**:
1. Select 3-5 image files
2. Submit upload
3. Verify all images uploaded
4. Verify all URLs returned

**Expected Result**: All images uploaded, all URLs returned

**Test Case**: TC-IMG-003  
**Description**: Upload fails with invalid file  
**Steps**:
1. Select non-image file (e.g., .pdf)
2. Submit upload
3. Verify error message

**Expected Result**: Error message displayed, upload rejected

**Test Case**: TC-IMG-004  
**Description**: Upload fails with oversized file  
**Steps**:
1. Select image > 10MB
2. Submit upload
3. Verify error message

**Expected Result**: Error message displayed, upload rejected

### 2. Product Form Validation

**Test Case**: TC-FORM-001  
**Description**: Submit form with all required fields  
**Steps**:
1. Fill all required fields (title, description, price, category, condition, location)
2. Upload at least one image
3. Submit form
4. Verify form submits successfully

**Expected Result**: Form submits, success message shown

**Test Case**: TC-FORM-002  
**Description**: Submit form with missing required field  
**Steps**:
1. Leave title field empty
2. Fill other required fields
3. Upload image
4. Attempt to submit
5. Verify validation error

**Expected Result**: Validation error displayed, form does not submit

**Test Case**: TC-FORM-003  
**Description**: Submit form with invalid price  
**Steps**:
1. Enter invalid price (e.g., "abc" or negative number)
2. Fill other required fields
3. Upload image
4. Attempt to submit
5. Verify validation error

**Expected Result**: Validation error displayed, form does not submit

**Test Case**: TC-FORM-004  
**Description**: Submit form without images  
**Steps**:
1. Fill all required fields
2. Do not upload any images
3. Attempt to submit
4. Verify validation error

**Expected Result**: Validation error displayed, form does not submit

### 3. API Integration

**Test Case**: TC-API-001  
**Description**: Create product as authenticated seller  
**Steps**:
1. Login as user with `seller` role
2. Fill product form
3. Upload images
4. Submit form
5. Verify API returns success with `inventoryId` and `aiProductId`

**Expected Result**: Product created, IDs returned

**Test Case**: TC-API-002  
**Description**: Create product as non-seller user  
**Steps**:
1. Login as user without `seller` role
2. Fill product form
3. Upload images
4. Submit form
5. Verify API returns 403 error

**Expected Result**: 403 error returned, product not created

**Test Case**: TC-API-003  
**Description**: Create product without authentication  
**Steps**:
1. Do not login
2. Fill product form
3. Upload images
4. Submit form
5. Verify API returns 401 error

**Expected Result**: 401 error returned, product not created

**Test Case**: TC-API-004  
**Description**: Create product with missing required field  
**Steps**:
1. Login as seller
2. Fill form but omit `location`
3. Upload images
4. Submit form
5. Verify API returns 400 error

**Expected Result**: 400 error returned, product not created

### 4. Database Integration

**Test Case**: TC-DB-001  
**Description**: Verify inventory_items record created  
**Steps**:
1. Create product via form
2. Query database for `inventory_items` record
3. Verify record exists with correct data:
   - `kivitendo_article_number` starts with `SELLER-`
   - `selling_price_chf` matches form price (converted from cents)
   - `quantity_available` is 1
   - `condition_override` matches form condition
   - `location` matches form location
   - `assigned_to` matches user ID

**Expected Result**: Record exists with correct data

**Test Case**: TC-DB-002  
**Description**: Verify ai_extracted_products record created  
**Steps**:
1. Create product via form
2. Query database for `ai_extracted_products` record
3. Verify record exists with correct data:
   - `product_name` matches form title
   - `category` matches form category
   - `condition` matches form condition
   - `estimated_price_chf` matches form price (converted from cents)
   - `original_image_url` is first image URL
   - `created_by` matches user ID

**Expected Result**: Record exists with correct data

**Test Case**: TC-DB-003  
**Description**: Verify product_images records created  
**Steps**:
1. Create product with 3 images via form
2. Query database for `product_images` records
3. Verify 3 records exist:
   - All linked to same `product_id` (AI product ID)
   - First image has `is_primary = true`
   - Other images have `is_primary = false`
   - All `file_path` values match uploaded image URLs

**Expected Result**: All image records exist with correct data

**Test Case**: TC-DB-004  
**Description**: Verify inventory_items linked to ai_extracted_products  
**Steps**:
1. Create product via form
2. Query `inventory_items` record
3. Verify `ai_product_id` is set and matches `ai_extracted_products.id`

**Expected Result**: Records are linked correctly

### 5. Price Conversion

**Test Case**: TC-PRICE-001  
**Description**: Verify price conversion (CHF to cents)  
**Steps**:
1. Enter price as "599.99" in form
2. Submit form
3. Verify API receives `price: 59999` (in cents)
4. Verify database stores `selling_price_chf: 599.99`

**Expected Result**: Price correctly converted and stored

**Test Case**: TC-PRICE-002  
**Description**: Verify price with decimals  
**Steps**:
1. Enter price as "12.50" in form
2. Submit form
3. Verify API receives `price: 1250` (in cents)
4. Verify database stores `selling_price_chf: 12.50`

**Expected Result**: Price correctly converted and stored

**Test Case**: TC-PRICE-003  
**Description**: Verify price without decimals  
**Steps**:
1. Enter price as "100" in form
2. Submit form
3. Verify API receives `price: 10000` (in cents)
4. Verify database stores `selling_price_chf: 100.00`

**Expected Result**: Price correctly converted and stored

### 6. Error Handling

**Test Case**: TC-ERROR-001  
**Description**: Network error during image upload  
**Steps**:
1. Disconnect network
2. Attempt to upload image
3. Verify error message displayed
4. Verify form does not submit

**Expected Result**: Error message shown, form submission prevented

**Test Case**: TC-ERROR-002  
**Description**: Network error during product submission  
**Steps**:
1. Upload images successfully
2. Disconnect network
3. Attempt to submit product
4. Verify error message displayed
5. Verify form state preserved

**Expected Result**: Error message shown, form data preserved

**Test Case**: TC-ERROR-003  
**Description**: Server error (500) during product submission  
**Steps**:
1. Simulate server error (mock API)
2. Submit product
3. Verify error message displayed
4. Verify user can retry

**Expected Result**: Error message shown, retry possible

### 7. Success Flow

**Test Case**: TC-SUCCESS-001  
**Description**: Complete successful product listing  
**Steps**:
1. Login as seller
2. Fill all required fields
3. Upload 2-3 images
4. Submit form
5. Verify success modal displayed
6. Verify product details shown in modal
7. Verify form can be reset for new listing

**Expected Result**: Success modal shown, form can be reset

**Test Case**: TC-SUCCESS-002  
**Description**: Verify success modal shows correct data  
**Steps**:
1. Create product with specific title and price
2. Verify success modal displays:
   - Correct product title
   - Correct price
   - Correct condition
   - Product ID (inventory ID)

**Expected Result**: Modal shows correct product data

## Test Data

### Valid Test Products

1. **Laptop**
   - Title: "MacBook Pro 13 inch"
   - Description: "Used MacBook Pro in good condition"
   - Price: 599.99
   - Category: "Electronics"
   - Condition: "good"
   - Location: "Zürich"

2. **Phone**
   - Title: "iPhone 12"
   - Description: "iPhone 12, 64GB, black"
   - Price: 400.00
   - Category: "Electronics"
   - Condition: "like_new"
   - Location: "Bern"

### Invalid Test Data

1. Empty title
2. Negative price
3. Price with letters
4. Missing category
5. Missing condition

## Test Execution

### Manual Testing

1. Run through all test cases manually
2. Document results
3. Report any failures

### Automated Testing (Future)

1. Create unit tests for hooks
2. Create integration tests for API
3. Create E2E tests with Playwright/Cypress

## Success Criteria

- ✅ All image upload scenarios work
- ✅ All form validation scenarios work
- ✅ All API integration scenarios work
- ✅ All database integration scenarios work
- ✅ All price conversion scenarios work
- ✅ All error handling scenarios work
- ✅ All success flow scenarios work

## Related Files

- `src/components/marketplace/ProductListingForm.tsx` - Main form
- `src/components/marketplace/hooks/useProductSubmission.ts` - Submission logic
- `src/app/api/uploads/route.ts` - Image upload API
- `src/app/api/seller/products/route.ts` - Product creation API
- `scripts/db/migrations/004_ai_inventory_system.sql` - Database schema



