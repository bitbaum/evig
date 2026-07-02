import { NextRequest } from "next/server";
import { db } from "@/db";
import { parse } from 'csv-parse/sync';
import { aiExtractedProducts, inventoryItems, sustainabilityScores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { apiSuccess, apiError, apiBadRequest } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAdmin, ValidSession } from "@/lib/api/middleware";
import { validateBody, ImportCSVSchema } from '@/lib/schemas';
import { APPROVAL_STATUS } from '@/config/approval-status';
import { INVENTORY_ITEM_STATUS } from '@/config/marketplace-status';
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

// Staff-only: CSV import writes into the erfassung/inventory system, so it is
// gated on the same 'products' section as the sibling /api/admin/erfassung/* routes.
export const POST = withAdmin('products', async (request: NextRequest, session: ValidSession) => {
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
        const existing = await db
          .select({ id: inventoryItems.id })
          .from(inventoryItems)
          .where(eq(inventoryItems.kivitendoArticleNumber, row.Artikelnummer))
          .limit(1);

        if (existing.length > 0) {
          result.duplicates.push(row.Artikelnummer);
          result.skipped++;
          continue;
        }

        // Analyze product description with rule-based logic
        const analysis = analyzeProductDescription(row.Artikelbeschreibung, row.Hersteller);
        const sustainScore = calculateSustainabilityScore(analysis);

        // Per-row transaction: a mid-row failure (sustainability score insert,
        // inventory item insert) would otherwise leave an orphaned
        // aiExtractedProducts row with no downstream data. Rolling back the
        // single row keeps the batch importing the rest of the file.
        await db.transaction(async (tx) => {
          const [aiProduct] = await tx
            .insert(aiExtractedProducts)
            .values({
              productName: analysis.productName,
              productNameConfidence: String(analysis.confidence),
              brand: row.Hersteller || analysis.brand,
              brandConfidence: row.Hersteller ? '0.90' : String(analysis.confidence),
              category: analysis.category,
              categoryConfidence: String(analysis.confidence),
              estimatedPriceChf: String(parseFloat(row.Verkaufspreis) || 0),
              priceConfidence: row.Verkaufspreis && row.Verkaufspreis !== '0.00' ? '0.80' : '0.30',
              condition: analysis.condition,
              conditionConfidence: '0.60',
              aiProvider: 'csv_import',
              aiModel: 'rule_based_parser',
              processingTimeMs: 100,
              totalConfidence: String(analysis.confidence),
              rawAiResponse: {
                source: 'csv_import',
                original_data: row,
                analysis_method: 'rule_based'
              },
              createdBy: session.user.id,
              status: APPROVAL_STATUS.PENDING,
              kivitendoArticleNumber: row.Artikelnummer,
            })
            .returning({ id: aiExtractedProducts.id });

          if (!aiProduct) {
            throw new Error(`Failed to create AI product for ${row.Artikelnummer}`);
          }

          await tx
            .insert(sustainabilityScores)
            .values({
              productId: aiProduct.id,
              overallScore: sustainScore.overall_score,
              environmentalScore: sustainScore.environmental_score,
              socialScore: sustainScore.social_score,
              economicScore: sustainScore.economic_score,
              factors: sustainScore.factors,
              recommendations: sustainScore.recommendations,
              improvementSuggestions: sustainScore.improvement_suggestions,
              aiAnalysis: {
                assessment_method: 'rule_based',
                data_sources: ['product_description', 'brand_info'],
                confidence: 0.7
              },
              assessedBy: 'csv_import',
            });

          const [inventoryRow] = await tx
            .insert(inventoryItems)
            .values({
              aiProductId: aiProduct.id,
              kivitendoArticleNumber: row.Artikelnummer,
              legacyCsvData: row,
              status: INVENTORY_ITEM_STATUS.AVAILABLE,
              acquisitionCostChf: String(parseFloat(row.Verkaufspreis) * 0.7 || 0),
              sellingPriceChf: String(parseFloat(row.Verkaufspreis) || 0),
              assignedTo: session.user.id,
            })
            .returning({ id: inventoryItems.id });

          if (!inventoryRow) {
            throw new Error(`Failed to create inventory item for ${row.Artikelnummer}`);
          }
        });

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

// GET endpoint to retrieve import history (staff-only, same section as POST)
export const GET = withAdmin('products', async (_request: NextRequest, session: ValidSession) => {
  try {
    const importHistory = await db
      .select({
        id: inventoryItems.id,
        kivitendoArticleNumber: inventoryItems.kivitendoArticleNumber,
        legacyCsvData: inventoryItems.legacyCsvData,
        createdAt: inventoryItems.createdAt,
        productName: aiExtractedProducts.productName,
        brand: aiExtractedProducts.brand,
        category: aiExtractedProducts.category,
        aiStatus: aiExtractedProducts.status,
      })
      .from(inventoryItems)
      .leftJoin(aiExtractedProducts, eq(aiExtractedProducts.id, inventoryItems.aiProductId))
      .where(eq(inventoryItems.assignedTo, session.user.id))
      .orderBy(desc(inventoryItems.createdAt))
      .limit(50);

    return apiSuccess({
      imports: importHistory
    });

  } catch (error) {
    return apiError(error, "Importverlauf konnte nicht geladen werden");
  }
});
