import { supabase } from '../config/supabase.js';

async function setupDatabase() {
    console.log('Setting up Supabase database tables...\n');

    // Create assets table
    const { error: assetsError } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS assets (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

                -- Owner info
                user_id UUID NOT NULL,
                owner_genesis VARCHAR(256),

                -- Asset metadata
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                description TEXT,
                genre VARCHAR(100),
                price DECIMAL(18, 8) NOT NULL DEFAULT 0,
                is_limited BOOLEAN DEFAULT FALSE,
                limited_supply INTEGER,

                -- File URLs (Supabase Storage)
                audio_url TEXT NOT NULL,
                audio_path TEXT NOT NULL,
                cover_url TEXT,
                cover_path TEXT,

                -- Nexus blockchain info
                nexus_address VARCHAR(256) UNIQUE,
                nexus_name VARCHAR(255),
                nexus_txid VARCHAR(256),

                -- Status tracking
                status VARCHAR(50) DEFAULT 'pending',
                -- pending, confirming, confirmed, transfer_pending, transferred, failed

                -- Timestamps
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                confirmed_at TIMESTAMPTZ,

                -- Error tracking
                last_error TEXT,
                retry_count INTEGER DEFAULT 0
            );

            -- Create index for faster lookups
            CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
            CREATE INDEX IF NOT EXISTS idx_assets_nexus_address ON assets(nexus_address);
            CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
        `
    });

    if (assetsError) {
        console.log('Note: Could not create assets table via RPC. Creating via direct query...');

        // Try alternative approach - the table might already exist or need manual creation
        const { error } = await supabase.from('assets').select('id').limit(1);
        if (error && error.code === '42P01') {
            console.log('\n⚠️  Please create the assets table manually in Supabase Dashboard:');
            console.log('Go to: https://supabase.com/dashboard → Your Project → SQL Editor\n');
            console.log('Run this SQL:\n');
            console.log(`
CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    owner_genesis VARCHAR(256),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    price DECIMAL(18, 8) NOT NULL DEFAULT 0,
    is_limited BOOLEAN DEFAULT FALSE,
    limited_supply INTEGER,
    audio_url TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    cover_url TEXT,
    cover_path TEXT,
    nexus_address VARCHAR(256) UNIQUE,
    nexus_name VARCHAR(255),
    nexus_txid VARCHAR(256),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    last_error TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_nexus_address ON assets(nexus_address);
CREATE INDEX idx_assets_status ON assets(status);

-- Enable Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own assets
CREATE POLICY "Users can view own assets" ON assets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own assets
CREATE POLICY "Users can create own assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own assets
CREATE POLICY "Users can update own assets" ON assets
    FOR UPDATE USING (auth.uid() = user_id);
            `);
        } else {
            console.log('✅ Assets table already exists');
        }
    } else {
        console.log('✅ Assets table created successfully');
    }

    // Create transfers table for audit trail
    const { error: transfersError } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS asset_transfers (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                asset_id UUID REFERENCES assets(id),
                from_user_id UUID NOT NULL,
                from_genesis VARCHAR(256),
                to_user_id UUID,
                to_username VARCHAR(255),
                to_genesis VARCHAR(256),
                nexus_txid VARCHAR(256),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                confirmed_at TIMESTAMPTZ,
                error TEXT
            );
        `
    });

    if (transfersError) {
        console.log('\n⚠️  Also create asset_transfers table:\n');
        console.log(`
CREATE TABLE asset_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES assets(id),
    from_user_id UUID NOT NULL,
    from_genesis VARCHAR(256),
    to_user_id UUID,
    to_username VARCHAR(255),
    to_genesis VARCHAR(256),
    nexus_txid VARCHAR(256),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    error TEXT
);

CREATE INDEX idx_transfers_asset_id ON asset_transfers(asset_id);

-- If table already exists, add the to_user_id column:
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS to_user_id UUID;
        `);
    } else {
        console.log('✅ Asset transfers table created successfully');
    }

    console.log('\n✅ Database setup complete!');
}

setupDatabase().catch(console.error);
