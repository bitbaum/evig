-- Migration: 007_certification_system
-- Description: Add certification validation and verification system

-- ============================================================================
-- CERTIFICATION SYSTEM
-- ============================================================================

-- Create certification_types table for predefined certifications
CREATE TABLE IF NOT EXISTS certification_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- e.g., 'electronics', 'mechanics', 'software', 'safety'
    issuing_authority VARCHAR(200),
    validity_period_months INTEGER, -- How long certification is valid
    requires_verification BOOLEAN NOT NULL DEFAULT true,
    verification_method VARCHAR(50) DEFAULT 'document' CHECK (verification_method IN ('document', 'api', 'manual')),
    api_endpoint VARCHAR(500), -- For API verification
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create repairer_certifications table for individual certifications
CREATE TABLE IF NOT EXISTS repairer_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES repairer_applications(id) ON DELETE CASCADE,
    certification_type_id UUID REFERENCES certification_types(id),
    custom_name VARCHAR(200), -- For custom certifications not in predefined list
    issuing_authority VARCHAR(200),
    certification_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verification_method VARCHAR(50) DEFAULT 'document',
    verification_result JSONB DEFAULT '{}',
    admin_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    document_path VARCHAR(500), -- Link to verification document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id, certification_type_id, certification_number)
);

-- Insert common Swiss and international certifications
INSERT INTO certification_types (slug, name, description, category, issuing_authority, validity_period_months, requires_verification) VALUES
    ('swiss_electronics_technician', 'Elektroniker EFZ', 'Schweizer Fachausweis für Elektroniker', 'electronics', 'Swiss Federal Office for Professional Education and Technology', 0, true),
    ('eu_electrical_safety', 'EU Elektrosicherheit Zertifizierung', 'Europäische Elektrosicherheitszertifizierung', 'safety', 'European Commission', 60, true),
    ('apple_certified_technician', 'Apple Certified Technician', 'Apple-zertifizierter Techniker', 'electronics', 'Apple Inc.', 24, true),
    ('microsoft_certified', 'Microsoft Certified Professional', 'Microsoft-zertifizierter Fachmann', 'software', 'Microsoft Corporation', 36, true),
    ('cisco_certified', 'Cisco Certified Network Associate', 'Cisco-zertifizierter Netzwerktechniker', 'networking', 'Cisco Systems', 36, true),
    ('data_recovery_certified', 'Certified Data Recovery Professional', 'Zertifizierter Datenrettungsprofi', 'data_recovery', 'International Association of Privacy Professionals', 24, true),
    ('mobile_repair_certified', 'Mobile Device Repair Certification', 'Zertifizierung für Mobilgeräte-Reparaturen', 'electronics', 'Mobile Repair Certification Board', 12, true),
    ('welding_certification', 'Schweisszertifikat', 'Fachausweis für Schweisstechnik', 'mechanics', 'Swiss Welding Society', 60, true),
    ('bicycle_mechanic_certified', 'Fahrradmechaniker Zertifikat', 'Zertifizierung für Fahrradmechanik', 'mechanics', 'Swiss Cycling Federation', 24, true),
    ('appliance_repair_certified', 'Haushaltsgeräte Reparatur Zertifikat', 'Zertifizierung für Haushaltsgeräte-Reparaturen', 'appliances', 'European Appliance Repair Association', 36, true)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repairer_certifications_application_id ON repairer_certifications(application_id);
CREATE INDEX IF NOT EXISTS idx_repairer_certifications_status ON repairer_certifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_repairer_certifications_type ON repairer_certifications(certification_type_id);

-- ============================================================================
-- UPDATE EXISTING APPLICATIONS
-- ============================================================================

-- Migrate existing certifications from repairer_applications to new structure
DO $$
DECLARE
    app_record RECORD;
    cert_record JSONB;
BEGIN
    FOR app_record IN SELECT id, certifications FROM repairer_applications WHERE certifications IS NOT NULL AND jsonb_array_length(certifications) > 0
    LOOP
        FOR cert_record IN SELECT * FROM jsonb_array_elements(app_record.certifications)
        LOOP
            -- Insert certification if it has required fields
            IF cert_record->>'name' IS NOT NULL THEN
                INSERT INTO repairer_certifications (
                    application_id,
                    custom_name,
                    issuing_authority,
                    certification_number,
                    issue_date,
                    expiry_date,
                    verification_status
                ) VALUES (
                    app_record.id,
                    cert_record->>'name',
                    cert_record->>'authority',
                    cert_record->>'number',
                    CASE WHEN cert_record->>'issueDate' != '' THEN (cert_record->>'issueDate')::DATE ELSE NULL END,
                    CASE WHEN cert_record->>'expiryDate' != '' THEN (cert_record->>'expiryDate')::DATE ELSE NULL END,
                    'pending'
                )
                ON CONFLICT (application_id, certification_type_id, certification_number) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;