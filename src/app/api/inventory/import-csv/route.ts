import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parse } from 'csv-parse/sync';
import { TABLE_NAMES } from "@/config/database";
import { apiSuccess, apiError } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAuth, ValidSession } from "@/lib/api/middleware";
import { validateBody, ImportCSVSchema } from '@/lib/schemas';
import { APPROVAL_STATUS } from '@/config/approval-status';

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

        // Analyze product description with AI-like logic
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
            status: APPROVAL_STATUS.APPROVED, // Auto-approve CSV imports
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
            acquisition_cost_chf: parseFloat(row.Verkaufspreis) * 0.7 || 0, // Estimate acquisition cost
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

interface ProductAnalysis {
  productName: string;
  brand: string;
  category: string;
  condition: string;
  confidence: number;
}

// Rule-based product analysis for CSV imports
function analyzeProductDescription(description: string, manufacturer: string): ProductAnalysis {
  const desc = description.toLowerCase();
  const brand = manufacturer || 'Unknown';

  // Extract product type and category
  let category = 'Sonstiges';
  let condition = 'good';
  let confidence = 0.7;

  // Category detection rules
  if (desc.includes('laptop') || desc.includes('notebook') || desc.includes('macbook') || desc.includes('thinkpad') || desc.includes('xps')) {
    category = 'Laptops';
    confidence = 0.9;
  } else if (desc.includes('iphone') || desc.includes('samsung') || desc.includes('smartphone') || desc.includes('handy') || desc.includes('telefon')) {
    category = 'Smartphones';
    confidence = 0.9;
  } else if (desc.includes('monitor') || desc.includes('bildschirm') || desc.includes('display')) {
    category = 'Monitore';
    confidence = 0.85;
  } else if (desc.includes('ram') || desc.includes('memory') || desc.includes('ddr') || desc.includes('speicher')) {
    category = 'Computer-Komponenten';
    confidence = 0.8;
  } else if (desc.includes('ssd') || desc.includes('hdd') || desc.includes('festplatte') || desc.includes('hard drive')) {
    category = 'Computer-Komponenten';
    confidence = 0.8;
  } else if (desc.includes('tastatur') || desc.includes('keyboard') || desc.includes('maus') || desc.includes('mouse')) {
    category = 'Peripheriegeräte';
    confidence = 0.8;
  } else if (desc.includes('drucker') || desc.includes('printer')) {
    category = 'Peripheriegeräte';
    confidence = 0.8;
  }

  // Condition detection
  if (desc.includes('neu') || desc.includes('new') || desc.includes('unbenutzt')) {
    condition = 'new';
  } else if (desc.includes('wie neu') || desc.includes('excellent') || desc.includes('ausgezeichnet')) {
    condition = 'excellent';
  } else if (desc.includes('gut') || desc.includes('good')) {
    condition = 'good';
  } else if (desc.includes('akzeptabel') || desc.includes('fair') || desc.includes('gebraucht')) {
    condition = 'fair';
  }

  return {
    productName: description,
    brand: brand,
    category: category,
    condition: condition,
    confidence: confidence
  };
}

// Calculate sustainability score for imported products
function calculateSustainabilityScore(analysis: ProductAnalysis) {
  let score = 50; // Base score

  // Brand sustainability factors
  const sustainableBrands = ['apple', 'fairphone', 'shift', 'framework', 'lenovo'];
  if (sustainableBrands.some(brand => analysis.brand?.toLowerCase().includes(brand))) {
    score += 15;
  }

  // Product type factors
  if (analysis.category === 'Laptops' && analysis.brand === 'Apple') {
    score += 10; // Apple has good recycling programs
  }

  // Condition factors
  if (analysis.condition === 'new') {
    score -= 10; // New products have higher environmental impact
  } else if (analysis.condition === 'good' || analysis.condition === 'excellent') {
    score += 5; // Refurbished products are more sustainable
  }

  return {
    overall_score: Math.max(0, Math.min(100, score)),
    environmental_score: Math.max(0, Math.min(100, score - 5)),
    social_score: Math.max(0, Math.min(100, score)),
    economic_score: Math.max(0, Math.min(100, score + 10)),
    factors: {
      brand_sustainability: sustainableBrands.some(brand => analysis.brand?.toLowerCase().includes(brand)) ? 75 : 40,
      product_recyclability: analysis.category === 'Laptops' ? 70 : 50,
      refurbishment_benefit: analysis.condition !== 'new' ? 80 : 30
    },
    recommendations: [
      'Consider refurbishing before disposal',
      'Check manufacturer take-back programs',
      'Opt for energy-efficient models'
    ],
    improvement_suggestions: [
      'Choose products from sustainable brands',
      'Consider refurbished options',
      'Look for products with longer warranty periods'
    ]
  };
}

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















