# RevampIT Database Schema

This document describes the PostgreSQL database schema for the RevampIT platform.

## Overview

The database contains 62 tables across several domains:
- **Authentication**: Users, sessions, accounts
- **Content Management**: Pages, blog posts, translations
- **E-Commerce**: Products, orders, inventory
- **AI/HIRN**: Document embeddings, chat history
- **Team/Staff**: Team members, profiles

## Tables

### accounts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| type | text |  |  |  |
| provider | text |  |  |  |
| provider_account_id | text |  |  |  |
| refresh_token | text | ✓ |  |  |
| access_token | text | ✓ |  |  |
| expires_at | integer | ✓ |  |  |
| token_type | text | ✓ |  |  |
| scope | text | ✓ |  |  |
| id_token | text | ✓ |  |  |
| session_state | text | ✓ |  |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `accounts_provider_provider_account_id_key`: UNIQUE 

### ai_extracted_products

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| original_image_url | text | ✓ |  |  |
| extracted_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| product_name | text | ✓ |  |  |
| product_name_confidence | numeric | ✓ |  |  |
| brand | text | ✓ |  |  |
| brand_confidence | numeric | ✓ |  |  |
| model | text | ✓ |  |  |
| model_confidence | numeric | ✓ |  |  |
| category | text | ✓ |  |  |
| category_confidence | numeric | ✓ |  |  |
| subcategory | text | ✓ |  |  |
| subcategory_confidence | numeric | ✓ |  |  |
| estimated_price_chf | numeric | ✓ |  |  |
| price_confidence | numeric | ✓ |  |  |
| condition | text | ✓ |  |  |
| condition_confidence | numeric | ✓ |  |  |
| specifications | jsonb | ✓ | `'{}'::jsonb` |  |
| specs_confidence | numeric | ✓ |  |  |
| color | text | ✓ |  |  |
| color_confidence | numeric | ✓ |  |  |
| material | text | ✓ |  |  |
| material_confidence | numeric | ✓ |  |  |
| dimensions | jsonb | ✓ | `'{}'::jsonb` |  |
| weight_grams | integer | ✓ |  |  |
| weight_confidence | numeric | ✓ |  |  |
| ai_provider | text | ✓ | `'openai'::text` |  |
| ai_model | text | ✓ | `'gpt-4-vision-preview'::text` |  |
| processing_time_ms | integer | ✓ |  |  |
| total_confidence | numeric | ✓ |  |  |
| raw_ai_response | jsonb | ✓ | `'{}'::jsonb` |  |
| created_by | uuid | ✓ |  |  |
| status | text | ✓ | `'pending_review'::text` |  |
| reviewed_by | uuid | ✓ |  |  |
| reviewed_at | timestamp with time zone | ✓ |  |  |
| review_notes | text | ✓ |  |  |
| kivitendo_article_number | text | ✓ |  |  |
| external_product_id | text | ✓ |  |  |
| marketplace_listing_id | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `created_by` → `users.id`
- `reviewed_by` → `users.id`

### ai_processing_logs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| product_id | uuid | ✓ |  |  |
| request_type | text |  |  |  |
| provider | text |  |  |  |
| model | text |  |  |  |
| input_data | jsonb | ✓ | `'{}'::jsonb` |  |
| response_data | jsonb | ✓ | `'{}'::jsonb` |  |
| processing_time_ms | integer | ✓ |  |  |
| tokens_used | integer | ✓ |  |  |
| cost_cents | numeric | ✓ |  |  |
| confidence_score | numeric | ✓ |  |  |
| accuracy_rating | numeric | ✓ |  |  |
| error_message | text | ✓ |  |  |
| user_id | uuid | ✓ |  |  |
| ip_address | inet | ✓ |  |  |
| user_agent | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `product_id` → `ai_extracted_products.id`
- `user_id` → `users.id`

### applications

Volunteer/intern/partnership applications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| type | text |  |  |  |
| motivation | text | ✓ |  |  |
| availability | text | ✓ |  |  |
| skills | ARRAY | ✓ |  |  |
| experience | text | ✓ |  |  |
| start_date | date | ✓ |  |  |
| referring_organization | text | ✓ |  |  |
| case_manager_contact | text | ✓ |  |  |
| status | text | ✓ | `'submitted'::text` |  |
| reviewed_by | text | ✓ |  |  |
| reviewed_at | timestamp with time zone | ✓ |  |  |
| interview_date | timestamp with time zone | ✓ |  |  |
| decision_notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

### audit_logs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid | ✓ |  |  |
| action | character varying |  |  |  |
| resource_type | character varying |  |  |  |
| resource_id | uuid | ✓ |  |  |
| old_values | jsonb | ✓ |  |  |
| new_values | jsonb | ✓ |  |  |
| ip_address | inet | ✓ |  |  |
| user_agent | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`

### blog_posts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| slug | character varying |  |  |  |
| title | character varying |  |  |  |
| content | text |  |  |  |
| excerpt | text | ✓ |  |  |
| featured_image | text | ✓ |  |  |
| seo_title | character varying | ✓ |  |  |
| seo_description | text | ✓ |  |  |
| meta_keywords | text | ✓ |  |  |
| category_id | uuid | ✓ |  |  |
| tags | ARRAY | ✓ | `'{}'::text[]` |  |
| is_published | boolean |  | `false` |  |
| published_at | timestamp with time zone | ✓ |  |  |
| created_by | uuid |  |  |  |
| updated_by | uuid |  |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `updated_by` → `users.id`
- `category_id` → `categories.id`
- `created_by` → `users.id`

**Notable Indexes:**
- `blog_posts_slug_key`: UNIQUE 
- `idx_blog_posts_tags`:  

### categories

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| slug | character varying |  |  |  |
| name | character varying |  |  |  |
| description | text | ✓ |  |  |
| color | character varying | ✓ |  |  |
| is_active | boolean |  | `true` |  |
| created_by | uuid |  |  |  |
| updated_by | uuid |  |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Notable Indexes:**
- `categories_slug_key`: UNIQUE 

### conversations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| title | text | ✓ |  |  |
| type | text |  |  |  |
| context_id | text | ✓ |  |  |
| participant_1 | uuid |  |  |  |
| participant_2 | uuid |  |  |  |
| last_message_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| last_message_preview | text | ✓ |  |  |
| unread_count_1 | integer | ✓ | `0` |  |
| unread_count_2 | integer | ✓ | `0` |  |
| is_active | boolean | ✓ | `true` |  |
| archived_by_1 | boolean | ✓ | `false` |  |
| archived_by_2 | boolean | ✓ | `false` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `participant_1` → `users.id`
- `participant_2` → `users.id`

**Notable Indexes:**
- `conversations_participant_1_participant_2_type_context_id_key`: UNIQUE 

### donations

Donation records

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid | ✓ |  |  |
| amount_cents | integer |  |  |  |
| currency | text | ✓ | `'CHF'::text` |  |
| payment_method | text | ✓ |  |  |
| payment_reference | text | ✓ |  |  |
| payment_date | timestamp with time zone | ✓ |  |  |
| is_recurring | boolean | ✓ | `false` |  |
| recurring_frequency | text | ✓ |  |  |
| donor_name | text | ✓ |  |  |
| donor_email | text | ✓ |  |  |
| donor_address | text | ✓ |  |  |
| receipt_requested | boolean | ✓ | `false` |  |
| receipt_sent | boolean | ✓ | `false` |  |
| receipt_sent_at | timestamp with time zone | ✓ |  |  |
| notes | text | ✓ |  |  |
| thank_you_sent | boolean | ✓ | `false` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

### email_verification_tokens

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| token | character varying |  |  |  |
| expires_at | timestamp with time zone |  |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `email_verification_tokens_token_key`: UNIQUE 

### escrow_accounts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| transaction_id | uuid |  |  |  |
| total_amount_cents | bigint |  |  |  |
| currency | character varying |  | `'CHF'::character varying` |  |
| held_amount_cents | bigint |  | `0` |  |
| released_amount_cents | bigint |  | `0` |  |
| release_conditions | jsonb | ✓ | `'{}'::jsonb` |  |
| auto_release_days | integer | ✓ | `7` |  |
| release_deadline | timestamp with time zone | ✓ |  |  |
| status | character varying |  | `'active'::character varying` |  |
| buyer_id | uuid |  |  |  |
| seller_id | uuid | ✓ |  |  |
| released_at | timestamp with time zone | ✓ |  |  |
| released_by | uuid | ✓ |  |  |
| release_notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `released_by` → `users.id`
- `transaction_id` → `payment_transactions.id`
- `buyer_id` → `users.id`
- `seller_id` → `users.id`

### escrow_releases

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| escrow_account_id | uuid |  |  |  |
| transaction_id | uuid | ✓ |  |  |
| amount_cents | bigint |  |  |  |
| release_type | character varying |  |  |  |
| reason | text | ✓ |  |  |
| released_by | uuid |  |  |  |
| released_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| metadata | jsonb | ✓ | `'{}'::jsonb` |  |

**Foreign Keys:**
- `released_by` → `users.id`
- `transaction_id` → `payment_transactions.id`
- `escrow_account_id` → `escrow_accounts.id`

### hirn_chat_history

Stores admin chat conversations for context

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid | ✓ |  |  |
| session_id | uuid |  |  |  |
| role | text |  |  |  |
| content | text |  |  |  |
| context_chunks | ARRAY | ✓ |  |  |
| provider | text | ✓ |  |  |
| model | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

### hirn_chunks

Stores document chunks with vector embeddings for similarity search

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| document_id | uuid |  |  |  |
| content | text |  |  |  |
| chunk_index | integer |  |  |  |
| embedding | USER-DEFINED | ✓ |  | Vector embedding (768 dimensions) for semantic search |
| metadata | jsonb | ✓ | `'{}'::jsonb` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `document_id` → `hirn_documents.id`

**Notable Indexes:**
- `idx_hirn_chunks_embedding`:  VECTOR (HNSW)

### hirn_documents

Stores original documents for RAG knowledge base

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| source_path | text |  |  |  |
| source_type | text |  |  |  |
| title | text | ✓ |  |  |
| content | text |  |  |  |
| content_hash | text |  |  |  |
| metadata | jsonb | ✓ | `'{}'::jsonb` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |
| indexed_at | timestamp with time zone | ✓ |  |  |

**Notable Indexes:**
- `hirn_documents_source_path_key`: UNIQUE 

### hirn_provider_settings

Stores AI provider configurations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| scope | text |  | `'system'::text` |  |
| user_id | uuid | ✓ |  |  |
| provider | text |  |  |  |
| is_enabled | boolean | ✓ | `true` |  |
| is_default | boolean | ✓ | `false` |  |
| settings | jsonb | ✓ | `'{}'::jsonb` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `hirn_provider_settings_scope_user_id_provider_key`: UNIQUE 

### inventory_items

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| ai_product_id | uuid | ✓ |  |  |
| kivitendo_article_number | text | ✓ |  |  |
| legacy_csv_data | jsonb | ✓ | `'{}'::jsonb` |  |
| location | text | ✓ |  |  |
| quantity_available | integer | ✓ | `0` |  |
| quantity_reserved | integer | ✓ | `0` |  |
| quantity_sold | integer | ✓ | `0` |  |
| status | text | ✓ | `'available'::text` |  |
| condition_override | text | ✓ |  |  |
| condition_notes | text | ✓ |  |  |
| acquisition_cost_chf | numeric | ✓ |  |  |
| selling_price_chf | numeric | ✓ |  |  |
| min_selling_price_chf | numeric | ✓ |  |  |
| external_product_id | text | ✓ |  |  |
| marketplace_status | text | ✓ | `'draft'::text` |  |
| assigned_to | uuid | ✓ |  |  |
| assigned_at | timestamp with time zone | ✓ |  |  |
| assignment_notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `ai_product_id` → `ai_extracted_products.id`
- `assigned_to` → `users.id`

**Notable Indexes:**
- `inventory_items_kivitendo_article_number_key`: UNIQUE 
- `inventory_items_external_product_id_key`: UNIQUE

### invoices

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| invoice_number | character varying |  |  |  |
| type | character varying |  |  |  |
| status | character varying |  | `'draft'::character varying` |  |
| user_id | uuid |  |  |  |
| order_id | uuid | ✓ |  |  |
| service_appointment_id | uuid | ✓ |  |  |
| workshop_registration_id | uuid | ✓ |  |  |
| subtotal_cents | bigint |  | `0` |  |
| tax_cents | bigint |  | `0` |  |
| discount_cents | bigint |  | `0` |  |
| total_cents | bigint |  |  |  |
| currency | character varying |  | `'CHF'::character varying` |  |
| tax_rate | numeric | ✓ | `0.0770` |  |
| line_items | jsonb | ✓ | `'[]'::jsonb` |  |
| billing_address | jsonb | ✓ |  |  |
| shipping_address | jsonb | ✓ |  |  |
| issue_date | date |  | `CURRENT_DATE` |  |
| due_date | date | ✓ |  |  |
| paid_at | timestamp with time zone | ✓ |  |  |
| pdf_url | text | ✓ |  |  |
| pdf_generated_at | timestamp with time zone | ✓ |  |  |
| emailed_at | timestamp with time zone | ✓ |  |  |
| email_recipient | character varying | ✓ |  |  |
| notes | text | ✓ |  |  |
| payment_terms | text | ✓ | `'Payment due within 30 days'::` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `service_appointment_id` → `service_appointments.id`
- `order_id` → `orders.id`
- `user_id` → `users.id`
- `workshop_registration_id` → `workshop_registrations.id`

**Notable Indexes:**
- `invoices_invoice_number_key`: UNIQUE 

### marketplace_listings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| inventory_item_id | uuid | ✓ |  |  |
| title | text |  |  |  |
| description | text | ✓ |  |  |
| price_chf | numeric |  |  |  |
| platform | text |  |  |  |
| platform_listing_id | text | ✓ |  |  |
| platform_url | text | ✓ |  |  |
| status | text | ✓ | `'draft'::text` |  |
| is_featured | boolean | ✓ | `false` |  |
| views_count | integer | ✓ | `0` |  |
| favorites_count | integer | ✓ | `0` |  |
| sold_at | timestamp with time zone | ✓ |  |  |
| sold_price_chf | numeric | ✓ |  |  |
| buyer_info | jsonb | ✓ | `'{}'::jsonb` |  |
| published_at | timestamp with time zone | ✓ |  |  |
| expires_at | timestamp with time zone | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `created_by` → `users.id`
- `inventory_item_id` → `inventory_items.id`

### message_reactions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| message_id | uuid |  |  |  |
| user_id | uuid |  |  |  |
| reaction | text |  |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`
- `message_id` → `messages.id`

**Notable Indexes:**
- `message_reactions_message_id_user_id_reaction_key`: UNIQUE 

### messages

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| conversation_id | uuid |  |  |  |
| sender_id | uuid |  |  |  |
| recipient_id | uuid |  |  |  |
| content | text |  |  |  |
| message_type | text | ✓ | `'text'::text` |  |
| attachment_url | text | ✓ |  |  |
| attachment_name | text | ✓ |  |  |
| attachment_size | integer | ✓ |  |  |
| is_read | boolean | ✓ | `false` |  |
| read_at | timestamp with time zone | ✓ |  |  |
| delivery_status | text | ✓ | `'sent'::text` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `sender_id` → `users.id`
- `conversation_id` → `conversations.id`
- `recipient_id` → `users.id`

### migrations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer |  | `nextval('migrations_id_seq'::r` |  |
| name | character varying |  |  |  |
| executed_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Notable Indexes:**
- `migrations_name_key`: UNIQUE 

### newsletter_subscriptions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| email | text |  |  |  |
| user_id | uuid | ✓ |  |  |
| frequency | text | ✓ | `'monthly'::text` |  |
| topics | ARRAY | ✓ |  |  |
| language | text | ✓ | `'de'::text` |  |
| is_active | boolean | ✓ | `true` |  |
| confirmed_at | timestamp with time zone | ✓ |  |  |
| unsubscribed_at | timestamp with time zone | ✓ |  |  |
| source | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `newsletter_subscriptions_email_key`: UNIQUE 

### notifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| type | text |  |  |  |
| title | text |  |  |  |
| content | text |  |  |  |
| related_type | text | ✓ |  |  |
| related_id | text | ✓ |  |  |
| sent_email | boolean | ✓ | `false` |  |
| sent_sms | boolean | ✓ | `false` |  |
| sent_in_app | boolean | ✓ | `false` |  |
| is_read | boolean | ✓ | `false` |  |
| read_at | timestamp with time zone | ✓ |  |  |
| scheduled_for | timestamp with time zone | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`

### order_items

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| order_id | uuid |  |  |  |
| product_title | text |  |  |  |
| product_sku | text | ✓ |  |  |
| variant_id | text | ✓ |  |  |
| inventory_item_id | uuid | ✓ |  |  |
| quantity | integer |  |  |  |
| unit_price_cents | bigint |  |  |  |
| total_price_cents | bigint |  |  |  |
| product_metadata | jsonb | ✓ | `'{}'::jsonb` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `order_id` → `orders.id`
- `inventory_item_id` → `inventory_items.id`

### order_status_history

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| order_id | uuid |  |  |  |
| old_status | text | ✓ |  |  |
| new_status | text |  |  |  |
| changed_by | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `changed_by` → `users.id`
- `order_id` → `orders.id`

### orders

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| status | text |  | `'pending'::text` |  |
| status_history | jsonb | ✓ | `'[]'::jsonb` |  |
| payment_intent_id | text | ✓ |  |  |
| payment_status | text | ✓ | `'pending'::text` |  |
| payment_method | text | ✓ |  |  |
| subtotal_cents | bigint |  | `0` |  |
| tax_cents | bigint |  | `0` |  |
| shipping_cents | bigint |  | `0` |  |
| discount_cents | bigint |  | `0` |  |
| total_amount_cents | bigint |  |  |  |
| currency | text |  | `'CHF'::text` |  |
| shipping_address | jsonb | ✓ |  |  |
| shipping_method | text | ✓ |  |  |
| tracking_number | text | ✓ |  |  |
| estimated_delivery | date | ✓ |  |  |
| seller_id | uuid | ✓ |  |  |
| external_order_id | text | ✓ |  |  |
| cart_id | text | ✓ |  |  |
| customer_notes | text | ✓ |  |  |
| internal_notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`
- `seller_id` → `users.id`

### password_reset_tokens

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| identifier | text |  |  |  |
| token | text |  |  |  |
| expires | timestamp with time zone |  |  |  |

### payment_analytics

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| date | date |  |  |  |
| provider_id | uuid | ✓ |  |  |
| total_transactions | integer | ✓ | `0` |  |
| total_volume_cents | bigint | ✓ | `0` |  |
| total_fees_cents | bigint | ✓ | `0` |  |
| total_refunds_cents | bigint | ✓ | `0` |  |
| currency_totals | jsonb | ✓ | `'{}'::jsonb` |  |
| status_breakdown | jsonb | ✓ | `'{}'::jsonb` |  |
| type_breakdown | jsonb | ✓ | `'{}'::jsonb` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `provider_id` → `payment_providers.id`

**Notable Indexes:**
- `payment_analytics_date_provider_id_key`: UNIQUE 

### payment_disputes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| dispute_number | character varying |  |  |  |
| transaction_id | uuid |  |  |  |
| provider_dispute_id | character varying | ✓ |  |  |
| amount_cents | bigint |  |  |  |
| currency | character varying |  | `'CHF'::character varying` |  |
| reason | character varying |  |  |  |
| status | character varying |  | `'opened'::character varying` |  |
| evidence | jsonb | ✓ | `'{}'::jsonb` |  |
| response | text | ✓ |  |  |
| response_deadline | timestamp with time zone | ✓ |  |  |
| resolution | character varying | ✓ |  |  |
| resolution_amount_cents | bigint | ✓ |  |  |
| resolved_at | timestamp with time zone | ✓ |  |  |
| resolved_by | uuid | ✓ |  |  |
| refund_id | uuid | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `transaction_id` → `payment_transactions.id`
- `refund_id` → `refunds.id`
- `resolved_by` → `users.id`

**Notable Indexes:**
- `payment_disputes_dispute_number_key`: UNIQUE 

### payment_methods

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| provider_id | uuid |  |  |  |
| type | character varying |  |  |  |
| provider_payment_method_id | character varying |  |  |  |
| last_four | character varying | ✓ |  |  |
| expiry_month | integer | ✓ |  |  |
| expiry_year | integer | ✓ |  |  |
| card_brand | character varying | ✓ |  |  |
| is_default | boolean |  | `false` |  |
| is_active | boolean |  | `true` |  |
| metadata | jsonb | ✓ | `'{}'::jsonb` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`
- `provider_id` → `payment_providers.id`

**Notable Indexes:**
- `payment_methods_user_id_provider_payment_method_id_key`: UNIQUE 

### payment_providers

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| slug | character varying |  |  |  |
| name | character varying |  |  |  |
| type | character varying |  |  |  |
| is_active | boolean |  | `true` |  |
| config | jsonb | ✓ | `'{}'::jsonb` |  |
| supported_currencies | ARRAY | ✓ | `ARRAY['CHF'::text, 'EUR'::text` |  |
| test_mode | boolean |  | `true` |  |
| fee_percentage | numeric | ✓ | `0.0000` |  |
| fee_fixed_cents | integer | ✓ | `0` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Notable Indexes:**
- `payment_providers_slug_key`: UNIQUE 

### payment_transactions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| provider_id | uuid |  |  |  |
| provider_transaction_id | character varying | ✓ |  |  |
| type | character varying |  |  |  |
| status | character varying |  | `'pending'::character varying` |  |
| amount_cents | bigint |  |  |  |
| currency | character varying |  | `'CHF'::character varying` |  |
| fee_cents | bigint | ✓ | `0` |  |
| net_amount_cents | bigint | ✓ | `0` |  |
| order_id | uuid | ✓ |  |  |
| service_appointment_id | uuid | ✓ |  |  |
| workshop_registration_id | uuid | ✓ |  |  |
| payment_method_id | uuid | ✓ |  |  |
| escrow_release_date | timestamp with time zone | ✓ |  |  |
| escrow_released | boolean |  | `false` |  |
| escrow_release_reason | text | ✓ |  |  |
| provider_response | jsonb | ✓ | `'{}'::jsonb` |  |
| failure_reason | text | ✓ |  |  |
| description | text | ✓ |  |  |
| internal_notes | text | ✓ |  |  |
| metadata | jsonb | ✓ | `'{}'::jsonb` |  |
| processed_at | timestamp with time zone | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `service_appointment_id` → `service_appointments.id`
- `workshop_registration_id` → `workshop_registrations.id`
- `payment_method_id` → `payment_methods.id`
- `provider_id` → `payment_providers.id`
- `order_id` → `orders.id`
- `user_id` → `users.id`

**Notable Indexes:**
- `idx_payment_transactions_workshop_reg`:  
- `payment_transactions_provider_transaction_id_key`: UNIQUE 

### peer_repair_offers

Offers from community helpers to repair requests

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| request_id | uuid |  |  |  |
| helper_id | uuid |  |  |  |
| message | text |  |  |  |
| estimated_time | character varying | ✓ |  |  |
| proposed_compensation | character varying | ✓ |  |  |
| relevant_skills | ARRAY | ✓ |  | Skills the helper brings to this repair |
| status | character varying | ✓ | `'pending'::character varying` | Offer status: pending, accepted, rejected, withdrawn |
| created_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `request_id` → `peer_repair_requests.id`
- `helper_id` → `users.id`

**Notable Indexes:**
- `unique_offer_per_user_request`: UNIQUE 

### peer_repair_requests

Peer-to-peer repair requests from community members seeking help

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| requester_id | uuid |  |  |  |
| category_id | character varying |  |  | Device category (laptop, smartphone, etc.) |
| device_brand | character varying | ✓ |  |  |
| device_model | character varying | ✓ |  |  |
| title | character varying |  |  |  |
| description | text |  |  |  |
| urgency | character varying | ✓ | `'normal'::character varying` | Request urgency: low, normal, high, urgent |
| budget_type | character varying |  |  | Compensation type: free, donation, fixed, hourly |
| budget_amount_cents | integer | ✓ |  |  |
| postal_code | character varying |  |  |  |
| city | character varying |  |  |  |
| canton | character varying |  |  |  |
| service_type | character varying | ✓ | `'flexible'::character varying` | Service delivery: pickup, dropoff, onsite, remote, flexible |
| skills_needed | ARRAY | ✓ |  | Array of skill IDs from peer-repairs config |
| image_urls | ARRAY | ✓ |  |  |
| status | character varying | ✓ | `'open'::character varying` |  |
| matched_offer_id | uuid | ✓ |  | Accepted offer ID, set when status becomes matched |
| offer_count | integer | ✓ | `0` | Cached count of offers (auto-updated by trigger) |
| expires_at | timestamp with time zone | ✓ | `(now() + '30 days'::interval)` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `requester_id` → `users.id`

### product_attributes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| category_id | uuid | ✓ |  |  |
| name | character varying |  |  |  |
| display_name | character varying | ✓ |  |  |
| data_type | character varying | ✓ | `'text'::character varying` |  |
| unit | character varying | ✓ |  |  |
| is_required | boolean | ✓ | `false` |  |
| is_filterable | boolean | ✓ | `false` |  |
| options | ARRAY | ✓ | `'{}'::text[]` |  |
| ai_extraction_prompt | text | ✓ |  |  |
| ai_confidence_threshold | numeric | ✓ | `0.7` |  |
| sort_order | integer | ✓ | `0` |  |
| is_active | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `category_id` → `product_categories.id`

**Notable Indexes:**
- `product_attributes_category_id_name_key`: UNIQUE 

### product_categories

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| slug | character varying |  |  |  |
| name | character varying |  |  |  |
| description | text | ✓ |  |  |
| parent_id | uuid | ✓ |  |  |
| level | integer | ✓ | `1` |  |
| icon | text | ✓ |  |  |
| color | character varying | ✓ |  |  |
| seo_title | text | ✓ |  |  |
| seo_description | text | ✓ |  |  |
| is_active | boolean | ✓ | `true` |  |
| sort_order | integer | ✓ | `0` |  |
| ai_detection_keywords | ARRAY | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `parent_id` → `product_categories.id`

**Notable Indexes:**
- `product_categories_slug_key`: UNIQUE 

### product_images

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| product_id | uuid | ✓ |  |  |
| filename | text |  |  |  |
| original_filename | text | ✓ |  |  |
| file_path | text |  |  |  |
| file_size_bytes | integer | ✓ |  |  |
| mime_type | text | ✓ |  |  |
| ai_description | text | ✓ |  |  |
| ai_tags | ARRAY | ✓ |  |  |
| is_primary | boolean | ✓ | `false` |  |
| width | integer | ✓ |  |  |
| height | integer | ✓ |  |  |
| dominant_colors | ARRAY | ✓ |  |  |
| image_quality | numeric | ✓ |  |  |
| upload_status | text | ✓ | `'processing'::text` |  |
| processed_at | timestamp with time zone | ✓ |  |  |
| uploaded_by | uuid | ✓ |  |  |
| is_public | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `product_id` → `ai_extracted_products.id`
- `uploaded_by` → `users.id`

### refunds

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| refund_number | character varying |  |  |  |
| original_transaction_id | uuid |  |  |  |
| refund_transaction_id | uuid | ✓ |  |  |
| amount_cents | bigint |  |  |  |
| currency | character varying |  | `'CHF'::character varying` |  |
| reason | character varying |  |  |  |
| reason_details | text | ✓ |  |  |
| status | character varying |  | `'requested'::character varying` |  |
| requested_by | uuid |  |  |  |
| approved_by | uuid | ✓ |  |  |
| processed_by | uuid | ✓ |  |  |
| invoice_id | uuid | ✓ |  |  |
| requested_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| approved_at | timestamp with time zone | ✓ |  |  |
| processed_at | timestamp with time zone | ✓ |  |  |
| completed_at | timestamp with time zone | ✓ |  |  |
| internal_notes | text | ✓ |  |  |
| customer_notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `approved_by` → `users.id`
- `invoice_id` → `invoices.id`
- `processed_by` → `users.id`
- `original_transaction_id` → `payment_transactions.id`
- `refund_transaction_id` → `payment_transactions.id`
- `requested_by` → `users.id`

**Notable Indexes:**
- `idx_refunds_original_transaction`:  
- `refunds_refund_number_key`: UNIQUE 

### repairer_availability

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| repairer_id | uuid |  |  |  |
| date | date |  |  |  |
| start_time | time without time zone |  |  |  |
| end_time | time without time zone |  |  |  |
| duration_hours | numeric | ✓ |  |  |
| availability_type | text | ✓ | `'available'::text` |  |
| booking_id | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `repairer_id` → `repairer_profiles.id`

**Notable Indexes:**
- `repairer_availability_repairer_id_date_start_time_key`: UNIQUE 

### repairer_profiles

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| business_name | text | ✓ |  |  |
| business_type | text |  | `'individual'::text` |  |
| description | text | ✓ |  |  |
| years_experience | integer | ✓ | `0` |  |
| phone | text |  |  |  |
| website | text | ✓ |  |  |
| address | text |  |  |  |
| city | text |  |  |  |
| postal_code | text |  |  |  |
| latitude | numeric | ✓ |  |  |
| longitude | numeric | ✓ |  |  |
| services_offered | ARRAY |  | `'{}'::text[]` |  |
| specializations | ARRAY | ✓ | `'{}'::text[]` |  |
| certifications | ARRAY | ✓ | `'{}'::text[]` |  |
| service_radius_km | integer | ✓ | `50` |  |
| remote_services | boolean | ✓ | `false` |  |
| hourly_rate_cents | integer | ✓ |  |  |
| emergency_fee_cents | integer | ✓ |  |  |
| home_visit_fee_cents | integer | ✓ |  |  |
| availability_schedule | jsonb | ✓ | `'{}'::jsonb` |  |
| response_time_hours | integer | ✓ | `24` |  |
| typical_turnaround_days | integer | ✓ | `3` |  |
| is_verified | boolean | ✓ | `false` |  |
| verification_date | timestamp with time zone | ✓ |  |  |
| verification_documents | ARRAY | ✓ | `'{}'::text[]` |  |
| total_jobs_completed | integer | ✓ | `0` |  |
| average_rating | numeric | ✓ | `0.0` |  |
| total_reviews | integer | ✓ | `0` |  |
| completion_rate | numeric | ✓ | `0.0` |  |
| is_active | boolean | ✓ | `true` |  |
| status | text | ✓ | `'pending_review'::text` |  |
| portfolio_images | ARRAY | ✓ | `'{}'::text[]` |  |
| insurance_info | text | ✓ |  |  |
| warranty_offered | boolean | ✓ | `false` |  |
| warranty_duration_months | integer | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `idx_repairer_profiles_services`:  
- `idx_repairer_profiles_specializations`:  
- `repairer_profiles_user_id_key`: UNIQUE 

### repairer_reviews

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| repairer_id | uuid |  |  |  |
| customer_id | uuid |  |  |  |
| appointment_id | uuid | ✓ |  |  |
| rating | integer |  |  |  |
| title | text | ✓ |  |  |
| comment | text | ✓ |  |  |
| pros | ARRAY | ✓ |  |  |
| cons | ARRAY | ✓ |  |  |
| timeliness_rating | integer | ✓ |  |  |
| quality_rating | integer | ✓ |  |  |
| communication_rating | integer | ✓ |  |  |
| repairer_response | text | ✓ |  |  |
| repairer_response_date | timestamp with time zone | ✓ |  |  |
| is_verified | boolean | ✓ | `false` |  |
| is_public | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `appointment_id` → `service_appointments.id`
- `repairer_id` → `repairer_profiles.id`
- `customer_id` → `users.id`

**Notable Indexes:**
- `repairer_reviews_repairer_id_customer_id_appointment_id_key`: UNIQUE 

### repairer_services

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| repairer_id | uuid |  |  |  |
| service_category | text |  |  |  |
| service_name | text |  |  |  |
| description | text | ✓ |  |  |
| base_price_cents | integer | ✓ |  |  |
| hourly_rate_cents | integer | ✓ |  |  |
| parts_included | boolean | ✓ | `false` |  |
| estimated_hours | numeric | ✓ |  |  |
| estimated_days | integer | ✓ |  |  |
| is_active | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `repairer_id` → `repairer_profiles.id`

**Notable Indexes:**
- `repairer_services_repairer_id_service_category_service_name_key`: UNIQUE 

### seller_profiles

Profiles for users selling products on the marketplace

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| display_name | text |  |  |  |
| bio | text | ✓ |  |  |
| seller_type | text | ✓ | `'individual'::text` |  |
| company_name | text | ✓ |  |  |
| city | text | ✓ |  |  |
| canton | text | ✓ |  |  |
| contact_email | text | ✓ |  |  |
| contact_phone | text | ✓ |  |  |
| is_active | boolean | ✓ | `true` |  |
| total_sales | integer | ✓ | `0` |  |
| total_products | integer | ✓ | `0` |  |
| average_rating | numeric | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `seller_profiles_user_id_key`: UNIQUE 

### service_appointments

Service appointment bookings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| service_type_id | uuid |  |  |  |
| preferred_date | timestamp with time zone | ✓ |  |  |
| confirmed_date | timestamp with time zone | ✓ |  |  |
| description | text | ✓ |  |  |
| device_info | text | ✓ |  |  |
| urgency | text | ✓ | `'normal'::text` |  |
| status | text | ✓ | `'requested'::text` |  |
| outcome_notes | text | ✓ |  |  |
| price_charged_cents | integer | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |
| repairer_id | uuid | ✓ |  | User ID of the assigned repairer |
| estimated_duration_hours | numeric | ✓ |  | Estimated time to complete the repair |
| quoted_price_chf | numeric | ✓ |  | Price quoted to customer for the repair |
| quote_approved | boolean | ✓ | `false` | Whether customer has approved the quote |
| quote_approved_at | timestamp with time zone | ✓ |  |  |
| diagnosis_notes | text | ✓ |  | Repairer notes from initial diagnosis |
| parts_needed | ARRAY | ✓ |  | Array of parts needed for repair |
| parts_ordered_at | timestamp with time zone | ✓ |  |  |
| completed_at | timestamp with time zone | ✓ |  |  |
| completion_notes | text | ✓ |  |  |
| customer_rating | integer | ✓ |  |  |
| customer_review | text | ✓ |  |  |
| reviewed_at | timestamp with time zone | ✓ |  |  |
| last_contact_at | timestamp with time zone | ✓ |  |  |
| messages_count | integer | ✓ | `0` |  |
| is_home_visit | boolean | ✓ | `false` | Whether this is an on-site repair at customer location |
| visit_address | text | ✓ |  |  |
| visit_postal_code | text | ✓ |  |  |
| visit_city | text | ✓ |  |  |
| repairer_profile_id | uuid | ✓ |  | Reference to repairer_profiles for detailed repairer info |

**Foreign Keys:**
- `user_id` → `users.id`
- `repairer_profile_id` → `repairer_profiles.id`
- `repairer_id` → `users.id`
- `service_type_id` → `service_types.id`

### service_types

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| slug | text |  |  |  |
| name | text |  |  |  |
| description | text | ✓ |  |  |
| duration_minutes | integer | ✓ | `60` |  |
| price_cents | integer | ✓ |  |  |
| requires_approval | boolean | ✓ | `false` |  |
| is_active | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |

**Notable Indexes:**
- `service_types_slug_key`: UNIQUE 

### sessions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| session_token | text |  |  |  |
| user_id | uuid |  |  |  |
| expires | timestamp with time zone |  |  |  |

**Foreign Keys:**
- `user_id` → `users.id`

### staff_permission_requests

Tracks staff permission requests for admin sections

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| requested_sections | ARRAY |  |  | Array of admin section names (e.g., hirn, finances, team) |
| reason | text |  |  |  |
| status | text |  | `'pending'::text` | pending, approved, or rejected |
| reviewed_by | uuid | ✓ |  |  |
| reviewed_at | timestamp with time zone | ✓ |  |  |
| review_notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `reviewed_by` → `users.id`
- `user_id` → `users.id`

### static_pages

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| slug | character varying |  |  |  |
| title | character varying |  |  |  |
| content | text |  |  |  |
| seo_title | character varying | ✓ |  |  |
| seo_description | text | ✓ |  |  |
| meta_keywords | text | ✓ |  |  |
| is_published | boolean |  | `false` |  |
| published_at | timestamp with time zone | ✓ |  |  |
| created_by | uuid |  |  |  |
| updated_by | uuid |  |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Notable Indexes:**
- `static_pages_slug_key`: UNIQUE 

### sustainability_scores

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| product_id | uuid | ✓ |  |  |
| overall_score | integer | ✓ |  |  |
| environmental_score | integer | ✓ |  |  |
| social_score | integer | ✓ |  |  |
| economic_score | integer | ✓ |  |  |
| factors | jsonb | ✓ | `'{}'::jsonb` |  |
| ai_analysis | jsonb | ✓ | `'{}'::jsonb` |  |
| ai_provider | text | ✓ | `'openai'::text` |  |
| ai_model | text | ✓ |  |  |
| recommendations | ARRAY | ✓ |  |  |
| improvement_suggestions | ARRAY | ✓ |  |  |
| assessed_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| assessed_by | text | ✓ | `'ai'::text` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `product_id` → `ai_extracted_products.id`

### technician_profiles

Profiles for users offering technical services (repairs, installations, consulting)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| display_name | text |  |  |  |
| bio | text | ✓ |  |  |
| skills | ARRAY | ✓ | `'{}'::text[]` |  |
| certifications | ARRAY | ✓ | `'{}'::text[]` |  |
| experience_years | integer | ✓ |  |  |
| service_types | ARRAY | ✓ | `'{}'::text[]` |  |
| hourly_rate_cents | integer | ✓ |  |  |
| availability | text | ✓ |  |  |
| service_area | text | ✓ |  |  |
| contact_email | text | ✓ |  |  |
| contact_phone | text | ✓ |  |  |
| preferred_contact | text | ✓ | `'platform'::text` |  |
| city | text | ✓ |  |  |
| canton | text | ✓ |  |  |
| is_active | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `idx_technician_profiles_skills`:  
- `technician_profiles_user_id_key`: UNIQUE 

### user_content_submissions

Tracks all user-submitted content requiring admin approval

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| content_type | text |  |  |  |
| content_id | uuid | ✓ |  |  |
| title | text |  |  |  |
| summary | text | ✓ |  |  |
| status | text | ✓ | `'pending'::text` |  |
| reviewed_by | uuid | ✓ |  |  |
| reviewed_at | timestamp with time zone | ✓ |  |  |
| review_notes | text | ✓ |  |  |
| rejection_reason | text | ✓ |  |  |
| submitted_at | timestamp with time zone | ✓ | `now()` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `reviewed_by` → `users.id`
- `user_id` → `users.id`

### user_notification_preferences

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| email_new_messages | boolean | ✓ | `true` |  |
| email_appointment_updates | boolean | ✓ | `true` |  |
| email_marketplace_updates | boolean | ✓ | `true` |  |
| in_app_messages | boolean | ✓ | `true` |  |
| in_app_appointments | boolean | ✓ | `true` |  |
| in_app_marketplace | boolean | ✓ | `true` |  |
| sms_urgent_messages | boolean | ✓ | `false` |  |
| sms_appointment_reminders | boolean | ✓ | `false` |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |
| updated_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `user_notification_preferences_user_id_key`: UNIQUE 

### user_profiles

Extended user profile information

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| user_id | uuid |  |  |  |
| first_name | text | ✓ |  |  |
| last_name | text | ✓ |  |  |
| company_name | text | ✓ |  |  |
| phone | text | ✓ |  |  |
| mobile | text | ✓ |  |  |
| address_line1 | text | ✓ |  |  |
| address_line2 | text | ✓ |  |  |
| postal_code | text | ✓ |  |  |
| city | text | ✓ |  |  |
| canton | text | ✓ |  |  |
| country | text | ✓ | `'Schweiz'::text` |  |
| interests | ARRAY | ✓ |  |  |
| preferred_language | text | ✓ | `'de'::text` |  |
| newsletter_subscribed | boolean | ✓ | `false` |  |
| newsletter_frequency | text | ✓ | `'monthly'::text` |  |
| is_supporter | boolean | ✓ | `false` |  |
| supporter_since | timestamp with time zone | ✓ |  |  |
| supporter_type | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `user_id` → `users.id`

### user_sessions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `uuid_generate_v4()` |  |
| user_id | uuid |  |  |  |
| session_token | character varying |  |  |  |
| expires_at | timestamp with time zone |  |  |  |
| created_at | timestamp with time zone | ✓ | `CURRENT_TIMESTAMP` |  |

**Foreign Keys:**
- `user_id` → `users.id`

**Notable Indexes:**
- `user_sessions_session_token_key`: UNIQUE 

### users

Central user accounts for RevampIT unified auth

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| name | text | ✓ |  |  |
| email | text |  |  |  |
| emailVerified | timestamp with time zone | ✓ |  |  |
| password_hash | text | ✓ |  |  |
| image | text | ✓ |  |  |
| role | text | ✓ | `'user'::text` |  |
| createdAt | timestamp with time zone | ✓ | `now()` |  |
| updatedAt | timestamp with time zone | ✓ | `now()` |  |
| email_verified | timestamp with time zone | ✓ |  |  |
| is_staff | boolean | ✓ | `false` | True if user is RevampIT staff (auto-set by @revamp-it.ch email) |
| staff_permissions | ARRAY | ✓ | `'{}'::text[]` | Array of admin sections this staff member can access. ["*"] = full access. |
| updated_at | timestamp with time zone | ✓ | `now()` |  |
| is_super_admin | boolean | ✓ | `false` | True if user is a super admin. Can be managed by other super admins. |

**Notable Indexes:**
- `idx_users_staff_permissions`:  
- `users_email_key`: UNIQUE 

### verification_tokens

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| identifier | text |  |  |  |
| token | text |  |  |  |
| expires | timestamp with time zone |  |  |  |

### workshop_instances

Specific workshop dates/sessions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| workshop_id | uuid |  |  |  |
| start_date | timestamp with time zone |  |  |  |
| end_date | timestamp with time zone | ✓ |  |  |
| location | text | ✓ | `'RevampIT, Birmensdorferstr. 3` |  |
| instructor | text | ✓ |  |  |
| max_participants | integer | ✓ |  |  |
| notes | text | ✓ |  |  |
| status | text | ✓ | `'scheduled'::text` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `workshop_id` → `workshops.id`

### workshop_materials

Materials (PDFs, documents, links) for workshops

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| workshop_id | uuid |  |  |  |
| instance_id | uuid | ✓ |  | NULL means available for all instances of this workshop |
| title | character varying |  |  |  |
| description | text | ✓ |  |  |
| material_type | character varying |  |  | Type of material: pdf, document, link, video, archive |
| url | text |  |  |  |
| file_size_bytes | integer | ✓ |  |  |
| access_type | character varying | ✓ | `'registered'::character varyin` | Who can access: public (everyone), registered (registered participants), attended (only those who attended) |
| display_order | integer | ✓ | `0` |  |
| is_active | boolean | ✓ | `true` |  |
| uploaded_by | uuid | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `instance_id` → `workshop_instances.id`
- `workshop_id` → `workshops.id`
- `uploaded_by` → `users.id`

### workshop_registrations

User registrations for workshops

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| user_id | uuid |  |  |  |
| workshop_instance_id | uuid |  |  |  |
| status | text | ✓ | `'pending'::text` |  |
| payment_status | text | ✓ | `'not_required'::text` |  |
| payment_amount_cents | integer | ✓ |  |  |
| payment_reference | text | ✓ |  |  |
| attended | boolean | ✓ | `false` |  |
| rating | integer | ✓ |  |  |
| feedback | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| confirmed_at | timestamp with time zone | ✓ |  |  |
| cancelled_at | timestamp with time zone | ✓ |  |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Foreign Keys:**
- `workshop_instance_id` → `workshop_instances.id`
- `user_id` → `users.id`

**Notable Indexes:**
- `idx_workshop_registrations_instance_id`:  
- `idx_workshop_registrations_user_id`:  
- `workshop_registrations_user_id_workshop_instance_id_key`: UNIQUE 

### workshops

Workshop definitions (admin managed)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid |  | `gen_random_uuid()` |  |
| slug | text |  |  |  |
| title | text |  |  |  |
| description | text | ✓ |  |  |
| category | text | ✓ |  |  |
| duration | text | ✓ |  |  |
| level | text | ✓ |  |  |
| max_participants | integer | ✓ | `12` |  |
| price_cents | integer | ✓ | `0` |  |
| is_active | boolean | ✓ | `true` |  |
| created_at | timestamp with time zone | ✓ | `now()` |  |
| updated_at | timestamp with time zone | ✓ | `now()` |  |

**Notable Indexes:**
- `workshops_slug_key`: UNIQUE 

## Key Relationships

```
users
  ├── accounts (OAuth providers)
  ├── sessions (active sessions)
  ├── user_content_submissions (content awaiting approval)
  ├── technician_profiles (repair skills)
  └── seller_profiles (seller info)

ai_extracted_products
  ├── product_images
  ├── product_customer_profiles
  └── inventory_items
       └── inventory_reservations

hirn_documents
  └── hirn_chunks (with vector embeddings)

hirn_conversations
  └── hirn_messages
```

## Vector Search

The `hirn_chunks` table uses pgvector for semantic search:
- Embedding dimension: 768 (nomic-embed-text)
- Index type: HNSW (Hierarchical Navigable Small World)
- Distance metric: Cosine similarity

