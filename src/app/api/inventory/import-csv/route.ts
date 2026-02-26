import { NextRequest } from "next/server";
import { query } from "@/lib/auth/db";
import { parse } from 'csv-parse/sync';
import { TABLE_NAMES } from "@/config/database";
import { apiSuccess, apiError, apiBadRequest } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAuth, ValidSession } from "@/lib/api/middleware";
import { validateBody, ImportCSVSchema } from '@/lib/schemas';
import { APPROVAL_STATUS } from '@/config/approval-status';
import { analyzeProductDescription, calculateSustainabilityScore } from '@/lib/inventory/csv-analysis';
import { rateLimiters } from '@/lib/security/rate-limit';

interface CSVRow {
  Artikelnummer: string;
  Typ: string;
  Artikelbeschreibung: string;
  Verkaufspreis: string;
  Hersteller: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  duplicates: string[];
}

const MAX_CSV_ROWS = 1000;

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    // SECURITY: Rate limiting - 5 imports per hour per user
    if (!rateLimiters.csvImport(`${session.user.id}:csv-import`)) {
      return apiBadRequest('Zu viele Importe. Bitte warte 1 Stunde.');
    }

    const body = await request.json();
    const validation = validateBody(ImportCSVSchema, body);
    if (!validation.success) return validation.error;
    const { csvContent } = validation.data;

    // Parse CSV
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // SECURITY: Limit row count to prevent resource exhaustion
    if (records.length > MAX_CSV_ROWS) {
      return apiBadRequest(`CSV darf maximal ${MAX_CSV_ROWS} Zeilen enthalten (${records.length} gefunden).`);
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: []
    };

    // Process each row
    for (const row of records) {
      try {
        // Skip invalid rows
        if (!row.Artikelnummer || !row.Artikelbeschreibung) {
          result.errors.push(`Skipping row with missing data: ${JSON.stringify(row)}`);
          result.skipped++;
          continue;
        }

        // Check for existing product
        const existingCheck = await query(
          `SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE kivitendo_article_number = $1 LIMIT 1`,
          [row.Artikelnummer]
        );

        if (existingCheck.rows.length > 0) {
          result.duplicates.push(row.Artikelnummer);
          result.skipped++;
          continue;
        }

        // Analyze product description with rule-based logic
        const analysis = analyzeProductDescription(row.Artikelbeschreibung, row.Hersteller);

        // Create AI-extracted product record
        const aiProductResult = await query<{ id: string }>(
          `INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} (
            product_name, product_name_confidence, brand, brand_confidence,
            category, category_confidence, estimated_price_chf, price_confidence,
            condition, condition_confidence, ai_provider, ai_model,
            processing_time_ms, total_confidence, raw_ai_response,
            created_by, status, kivitendo_article_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING id`,
          [
            analysis.productName,
            analysis.confidence,
            row.Hersteller || analysis.brand,
            row.Hersteller ? 0.9 : analysis.confidence,
            analysis.category,
            analysis.confidence,
            parseFloat(row.Verkaufspreis) || 0,
            row.Verkaufspreis && row.Verkaufspreis !== '0.00' ? 0.8 : 0.3,
            analysis.condition,
            0.6,
            'csv_import',
            'rule_based_parser',
            100,
            analysis.confidence,
            JSON.stringify({
              source: 'csv_import',
              original_data: row,
              analysis_method: 'rule_based'
            }),
            session.user.id,
            APPROVAL_STATUS.PENDING,
            row.Artikelnummer,
          ]
        );

        const aiProductId = aiProductResult.rows[0]?.id;
        if (!aiProductId) {
          result.errors.push(`Failed to create AI product for ${row.Artikelnummer}`);
          result.skipped++;
          continue;
        }

        // Calculate and save sustainability score
        const sustainabilityScore = calculateSustainabilityScore(analysis);
        await query(
          `INSERT INTO ${TABLE_NAMES.SUSTAINABILITY_SCORES} (
            product_id, overall_score, environmental_score, social_score,
            economic_score, factors, recommendations, improvement_suggestions,
            ai_analysis, assessed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            aiProductId,
            sustainabilityScore.overall_score,
            sustainabilityScore.environmental_score,
            sustainabilityScore.social_score,
            sustainabilityScore.economic_score,
            JSON.stringify(sustainabilityScore.factors),
            JSON.stringify(sustainabilityScore.recommendations),
            JSON.stringify(sustainabilityScore.improvement_suggestions),
            JSON.stringify({
              assessment_method: 'rule_based',
              data_sources: ['product_description', 'brand_info'],
              confidence: 0.7
            }),
            'csv_import',
          ]
        );

        // Create inventory item
        const inventoryResult = await query(
          `INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS} (
            ai_product_id, kivitendo_article_number, legacy_csv_data,
            status, acquisition_cost_chf, selling_price_chf, assigned_to
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            aiProductId,
            row.Artikelnummer,
            JSON.stringify(row),
            'available',
            parseFloat(row.Verkaufspreis) * 0.7 || 0,
            parseFloat(row.Verkaufspreis) || 0,
            session.user.id,
          ]
        );

        if (inventoryResult.rowCount === 0) {
          result.errors.push(`Failed to create inventory item for ${row.Artikelnummer}`);
          result.skipped++;
          continue;
        }

        result.imported++;

      } catch (error) {
        result.errors.push(`Error processing row ${row.Artikelnummer}: ${error}`);
        result.skipped++;
      }
    }

    return apiSuccess(result);

  } catch (error) {
    return apiError(error, "CSV-Daten konnten nicht importiert werden");
  }
});

// GET endpoint to retrieve import history
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const importHistory = await query(
      `SELECT
        i.id,
        i.kivitendo_article_number,
        i.legacy_csv_data,
        i.created_at,
        a.product_name,
        a.brand,
        a.category,
        a.status AS ai_status
      FROM ${TABLE_NAMES.INVENTORY_ITEMS} i
      LEFT JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} a ON a.id = i.ai_product_id
      WHERE i.assigned_to = $1
      ORDER BY i.created_at DESC
      LIMIT 50`,
      [session.user.id]
    );

    return apiSuccess({
      imports: importHistory.rows
    });

  } catch (error) {
    return apiError(error, "Importverlauf konnte nicht geladen werden");
  }
});
