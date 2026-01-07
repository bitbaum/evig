-- Migration: 006_document_verification_system
-- Description: Add document verification system for repairer applications

-- ============================================================================
-- DOCUMENT VERIFICATION SYSTEM
-- ============================================================================

-- Create document_types table for categorization
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    max_file_size_mb INTEGER DEFAULT 10,
    allowed_extensions TEXT[] DEFAULT '{pdf,jpg,jpeg,png}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create verification_documents table for individual document tracking
CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES repairer_applications(id) ON DELETE CASCADE,
    document_type_id UUID REFERENCES document_types(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id, document_type_id)
);

-- Insert default document types
INSERT INTO document_types (slug, name, description, is_required, max_file_size_mb, allowed_extensions) VALUES
    ('id_document', 'Personalausweis/Reisepass', 'Offizielles Ausweisdokument zur Identitätsverifizierung', true, 5, '{pdf,jpg,jpeg,png}'),
    ('certifications', 'Fachzertifizierungen', 'Zertifikate und Diplome für Fachkompetenz', false, 10, '{pdf,jpg,jpeg,png}'),
    ('insurance', 'Haftpflichtversicherung', 'Nachweis über gültige Haftpflichtversicherung', true, 5, '{pdf,jpg,jpeg,png}'),
    ('business_registration', 'Gewerbeschein/Handelsregister', 'Nachweis über Gewerbeanmeldung bei Bedarf', false, 5, '{pdf,jpg,jpeg,png}'),
    ('portfolio', 'Arbeitsproben/Portfolio', 'Beispiele früherer Arbeiten oder Referenzen', false, 15, '{pdf,jpg,jpeg,png,mp4,mov}'),
    ('tax_certificate', 'Steuerbescheinigung', 'Nachweis über steuerliche Registrierung', false, 5, '{pdf,jpg,jpeg,png}')
ON CONFLICT (slug) DO NOTHING;

-- Add document verification status to repairer_applications
ALTER TABLE repairer_applications ADD COLUMN IF NOT EXISTS document_verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (document_verification_status IN ('pending', 'in_review', 'approved', 'rejected', 'incomplete'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_documents_application_id ON verification_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_status ON verification_documents(status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_type ON verification_documents(document_type_id);

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Migrate existing verification_documents from repairer_applications to new structure
DO $$
DECLARE
    app_record RECORD;
    doc_url TEXT;
BEGIN
    FOR app_record IN SELECT id, verification_documents FROM repairer_applications WHERE verification_documents IS NOT NULL AND array_length(verification_documents, 1) > 0
    LOOP
        FOREACH doc_url IN ARRAY app_record.verification_documents
        LOOP
            -- Insert as generic document if URL exists
            INSERT INTO verification_documents (
                application_id,
                filename,
                original_filename,
                file_path,
                status
            ) VALUES (
                app_record.id,
                'migrated_' || split_part(doc_url, '/', -1),
                split_part(doc_url, '/', -1),
                doc_url,
                'pending'
            )
            ON CONFLICT (application_id, document_type_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;