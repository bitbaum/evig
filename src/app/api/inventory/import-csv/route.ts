import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parse } from 'csv-parse/sync';
import { TABLE_NAMES } from "@/config/database";
import { apiSuccess, apiError } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAuth, ValidSession } from "@/lib/api/middleware";
import { validateBody, ImportCSVSchema } from '@/lib/schemas';
import { APPROVAL_STATUS } from '@/config/approval-status';
import { analyzeProductDescription, calculateSustainabilityScore } from '@/lib/inventory/csv-analysis';

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

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validation = validateBody(ImportCSVSchema, body);
    if (!validation.success) return validation.error;
    const { csvContent, options } = validation.data;

    // Parse CSV
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

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
        const { data: existingProduct } = await supabase
          .from(TABLE_NAMES.INVENTORY_ITEMS)
          .select('id')
          .eq('kivitendo_article_number', row.Artikelnummer)
          .single();

        if (existingProduct) {
          result.duplicates.push(row.Artikelnummer);
          result.skipped++;
          continue;
        }

        // Analyze product description with rule-based logic
        const analysis = analyzeProductDescription(row.Artikelbeschreibung, row.Hersteller);

        // Create AI-extracted product record
        const { data: aiProduct, error: aiError } = await supabase
          .from(TABLE_NAMES.AI_EXTRACTED_PRODUCTS)
          .insert({
            product_name: analysis.productName,
            product_name_confidence: analysis.confidence,
            brand: row.Hersteller || analysis.brand,
            brand_confidence: row.Hersteller ? 0.9 : analysis.confidence,
            category: analysis.category,
            category_confidence: analysis.confidence,
            estimated_price_chf: parseFloat(row.Verkaufspreis) || 0,
            price_confidence: row.Verkaufspreis && row.Verkaufspreis !== '0.00' ? 0.8 : 0.3,
            condition: analysis.condition,
            condition_confidence: 0.6, // Lower confidence for CSV imports
            ai_provider: 'csv_import',
            ai_model: 'rule_based_parser',
            processing_time_ms: 100,
            total_confidence: analysis.confidence,
            raw_ai_response: {
              source: 'csv_import',
              original_data: row,
              analysis_method: 'rule_based'
            },
            created_by: session.user.id,
            status: APPROVAL_STATUS.PENDING,
            kivitendo_article_number: row.Artikelnummer
          })
          .select('id')
          .single();

        if (aiError) {
          result.errors.push(`Failed to create AI product for ${row.Artikelnummer}: ${aiError.message}`);
          result.skipped++;
          continue;
        }

        // Calculate and save sustainability score
        const sustainabilityScore = calculateSustainabilityScore(analysis);
        await supabase
          .from(TABLE_NAMES.SUSTAINABILITY_SCORES)
          .insert({
            product_id: aiProduct.id,
            overall_score: sustainabilityScore.overall_score,
            environmental_score: sustainabilityScore.environmental_score,
            social_score: sustainabilityScore.social_score,
            economic_score: sustainabilityScore.economic_score,
            factors: sustainabilityScore.factors,
            recommendations: sustainabilityScore.recommendations,
            improvement_suggestions: sustainabilityScore.improvement_suggestions,
            ai_analysis: {
              assessment_method: 'rule_based',
              data_sources: ['product_description', 'brand_info'],
              confidence: 0.7
            },
            assessed_by: 'csv_import'
          });

        // Create inventory item
        const { error: inventoryError } = await supabase
          .from(TABLE_NAMES.INVENTORY_ITEMS)
          .insert({
            ai_product_id: aiProduct.id,
            kivitendo_article_number: row.Artikelnummer,
            legacy_csv_data: row,
            status: 'available',
            acquisition_cost_chf: parseFloat(row.Verkaufspreis) * 0.7 || 0,
            selling_price_chf: parseFloat(row.Verkaufspreis) || 0,
            assigned_to: session.user.id
          });

        if (inventoryError) {
          result.errors.push(`Failed to create inventory item for ${row.Artikelnummer}: ${inventoryError.message}`);
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
    return apiError(error, "Failed to import CSV data");
  }
});

// GET endpoint to retrieve import history
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const supabase = await createClient();

    // Get recent imports
    const { data: imports, error } = await supabase
      .from(TABLE_NAMES.INVENTORY_ITEMS)
      .select(`
        id,
        kivitendo_article_number,
        legacy_csv_data,
        created_at,
        ai_extracted_products (
          product_name,
          brand,
          category,
          status
        )
      `)
      .eq('assigned_to', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return apiError(error, "Failed to fetch import history");
    }

    return apiSuccess({
      imports: imports || []
    });

  } catch (error) {
    return apiError(error, "Failed to fetch import history");
  }
});
