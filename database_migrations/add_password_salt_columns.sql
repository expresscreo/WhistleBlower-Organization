-- Migration to add password_salt columns for Web Crypto API password hashing
-- This replaces bcrypt with browser-native PBKDF2 hashing

-- Add password_salt column to bounties table
ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS password_salt TEXT;

-- Add anonymous_password_salt column to reports table  
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS anonymous_password_salt TEXT;

-- Update the create_report_with_evidence function to handle the new salt parameter
-- First, let's check if the function exists and drop it if it does
DROP FUNCTION IF EXISTS create_report_with_evidence(
    report_id_param TEXT,
    organization_id_param UUID,
    organization_name_param TEXT,
    title_param TEXT,
    description_param TEXT,
    category_param TEXT,
    state_param TEXT,
    lga_param TEXT,
    incident_address_param TEXT,
    incident_date_param DATE,
    is_anonymous_param BOOLEAN,
    anonymous_password_hash_param TEXT,
    anonymous_password_salt_param TEXT,
    evidence_paths_param TEXT[],
    report_type_param TEXT,
    is_voice_note_param BOOLEAN,
    is_feedback_param BOOLEAN
);

-- Create the updated function with salt parameter
CREATE OR REPLACE FUNCTION create_report_with_evidence(
    report_id_param TEXT,
    organization_id_param UUID,
    organization_name_param TEXT,
    title_param TEXT,
    description_param TEXT,
    category_param TEXT,
    state_param TEXT,
    lga_param TEXT,
    incident_address_param TEXT,
    incident_date_param DATE,
    is_anonymous_param BOOLEAN,
    anonymous_password_hash_param TEXT,
    anonymous_password_salt_param TEXT DEFAULT NULL,
    evidence_paths_param TEXT[] DEFAULT NULL,
    report_type_param TEXT DEFAULT 'text',
    is_voice_note_param BOOLEAN DEFAULT FALSE,
    is_feedback_param BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    report_uuid UUID;
BEGIN
    -- Generate a new UUID for the report
    report_uuid := gen_random_uuid();
    
    -- Insert the report
    INSERT INTO reports (
        id,
        report_id,
        organization_id,
        organization_name,
        title,
        description,
        category,
        state,
        lga,
        incident_address,
        incident_date,
        is_anonymous,
        anonymous_password_hash,
        anonymous_password_salt,
        evidence_paths,
        report_type,
        is_voice_note,
        is_feedback,
        status,
        created_at
    ) VALUES (
        report_uuid,
        report_id_param,
        organization_id_param,
        organization_name_param,
        title_param,
        description_param,
        category_param,
        state_param,
        lga_param,
        incident_address_param,
        incident_date_param,
        is_anonymous_param,
        anonymous_password_hash_param,
        anonymous_password_salt_param,
        evidence_paths_param,
        report_type_param,
        is_voice_note_param,
        is_feedback_param,
        'pending_review',
        NOW()
    );
    
    RETURN report_uuid;
END;
$$;

-- Add comments to the new columns
COMMENT ON COLUMN bounties.password_salt IS 'Salt used for PBKDF2 password hashing with Web Crypto API';
COMMENT ON COLUMN reports.anonymous_password_salt IS 'Salt used for PBKDF2 password hashing with Web Crypto API';
