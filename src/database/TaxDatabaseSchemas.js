/**
 * TaxDatabaseSchemas.js
 * 
 * Erweiterte Datenbank-Schemas für das PulseManager Tax System
 * Unterstützt deutsches Steuerrecht (§22 & §23 EStG), FIFO-Berechnung, 
 * Wallet-Management und umfassende Tax Reports
 * 
 * @author PulseManager Tax Team
 * @version 1.0.0
 * @since 2024-06-14
 */

class TaxDatabaseSchemas {
    /**
     * Vollständige Tax-Tabellen für PostgreSQL
     * Erweitert das bestehende Security Schema um Tax-spezifische Tabellen
     */
    static getTaxTablesSchema() {
        return `
            -- =============================================================================
            -- 🏛️ PULSEMANAGER TAX SYSTEM - DATABASE SCHEMA EXTENSION
            -- =============================================================================
            -- Erweitert das bestehende Security Schema um umfassende Tax-Funktionalität
            -- Kompatibel mit deutschem Steuerrecht (§22 & §23 EStG)
            
            -- =============================================================================
            -- WALLET MANAGEMENT
            -- =============================================================================
            
            -- Wallets Tabelle - Verwaltet User Wallets für Tax Reports
            CREATE TABLE IF NOT EXISTS tax_wallets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                wallet_address VARCHAR(42) NOT NULL,
                chain VARCHAR(50) NOT NULL DEFAULT 'ethereum',
                label VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Zusätzliche Metadaten
                wallet_type VARCHAR(50) DEFAULT 'hot', -- 'hot', 'cold', 'exchange'
                notes TEXT,
                last_sync TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT unique_user_wallet_chain UNIQUE(user_id, wallet_address, chain),
                CONSTRAINT valid_wallet_address CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$'),
                CONSTRAINT valid_chain CHECK (chain IN ('ethereum', 'pulsechain', 'polygon', 'bsc', 'arbitrum'))
            );
            
            -- =============================================================================
            -- CRYPTO TRANSACTIONS
            -- =============================================================================
            
            -- Crypto Transactions Tabelle - Alle Blockchain-Transaktionen
            CREATE TABLE IF NOT EXISTS crypto_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                wallet_id UUID NOT NULL REFERENCES tax_wallets(id) ON DELETE CASCADE,
                tx_hash VARCHAR(66) NOT NULL,
                block_number BIGINT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                from_address VARCHAR(42),
                to_address VARCHAR(42),
                token_address VARCHAR(42),
                token_symbol VARCHAR(20),
                token_name VARCHAR(255),
                token_decimals INTEGER DEFAULT 18,
                amount DECIMAL(36, 18) NOT NULL,
                amount_usd DECIMAL(15, 2),
                amount_eur DECIMAL(15, 2),
                gas_used BIGINT,
                gas_price DECIMAL(36, 0),
                gas_fee_eth DECIMAL(18, 8),
                gas_fee_usd DECIMAL(10, 2),
                
                -- Transaction Classification
                tx_type VARCHAR(50) NOT NULL, -- 'buy', 'sell', 'swap', 'transfer', 'roi', 'airdrop', 'spam'
                tax_category VARCHAR(50), -- 'paragraph_22', 'paragraph_23', 'tax_free', 'spam'
                dex_name VARCHAR(100),
                
                -- German Tax Specifics
                is_spam BOOLEAN DEFAULT false,
                is_roi BOOLEAN DEFAULT false,
                is_tax_relevant BOOLEAN DEFAULT true,
                holding_period_days INTEGER,
                
                -- Processing Status
                processed_for_tax BOOLEAN DEFAULT false,
                needs_manual_review BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT unique_tx_wallet_token UNIQUE(tx_hash, wallet_id, token_address, timestamp),
                CONSTRAINT valid_tx_type CHECK (tx_type IN ('buy', 'sell', 'swap', 'transfer', 'roi', 'airdrop', 'spam', 'fee')),
                CONSTRAINT valid_tax_category CHECK (tax_category IN ('paragraph_22', 'paragraph_23', 'tax_free', 'spam', 'pending')),
                CONSTRAINT positive_amount CHECK (amount >= 0)
            );
            
            -- =============================================================================
            -- TOKEN HOLDINGS & FIFO
            -- =============================================================================
            
            -- Token Holdings für Portfolio-Tracking
            CREATE TABLE IF NOT EXISTS token_holdings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                wallet_id UUID NOT NULL REFERENCES tax_wallets(id) ON DELETE CASCADE,
                token_address VARCHAR(42) NOT NULL,
                token_symbol VARCHAR(20) NOT NULL,
                token_name VARCHAR(255),
                total_amount DECIMAL(36, 18) NOT NULL DEFAULT 0,
                avg_buy_price_usd DECIMAL(15, 8),
                avg_buy_price_eur DECIMAL(15, 8),
                total_invested_usd DECIMAL(15, 2) DEFAULT 0,
                total_invested_eur DECIMAL(15, 2) DEFAULT 0,
                current_value_usd DECIMAL(15, 2) DEFAULT 0,
                current_value_eur DECIMAL(15, 2) DEFAULT 0,
                unrealized_gain_usd DECIMAL(15, 2) DEFAULT 0,
                unrealized_gain_eur DECIMAL(15, 2) DEFAULT 0,
                
                -- Timestamps
                first_purchase_date TIMESTAMP WITH TIME ZONE,
                last_transaction_date TIMESTAMP WITH TIME ZONE,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT unique_wallet_token UNIQUE(wallet_id, token_address),
                CONSTRAINT positive_total_amount CHECK (total_amount >= 0)
            );
            
            -- FIFO Queue für deutsche Steuer-Berechnung
            CREATE TABLE IF NOT EXISTS fifo_queue (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                wallet_id UUID NOT NULL REFERENCES tax_wallets(id) ON DELETE CASCADE,
                token_address VARCHAR(42) NOT NULL,
                amount DECIMAL(36, 18) NOT NULL,
                buy_price_usd DECIMAL(15, 8) NOT NULL,
                buy_price_eur DECIMAL(15, 8) NOT NULL,
                buy_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                remaining_amount DECIMAL(36, 18) NOT NULL,
                tx_hash VARCHAR(66) NOT NULL,
                
                -- Additional Data
                purchase_tx_id UUID REFERENCES crypto_transactions(id),
                is_fully_sold BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT positive_amounts CHECK (amount > 0 AND remaining_amount >= 0),
                CONSTRAINT remaining_not_greater_than_total CHECK (remaining_amount <= amount)
            );
            
            -- =============================================================================
            -- TAX REPORTS
            -- =============================================================================
            
            -- Tax Reports Tabelle
            CREATE TABLE IF NOT EXISTS tax_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                report_year INTEGER NOT NULL,
                report_type VARCHAR(50) DEFAULT 'annual', -- 'annual', 'quarterly', 'custom'
                
                -- Wallet Configuration
                wallet_addresses TEXT[], -- Array von Wallet-Adressen
                included_chains TEXT[], -- Array der berücksichtigten Chains
                
                -- Transaction Statistics
                total_transactions INTEGER DEFAULT 0,
                roi_transactions INTEGER DEFAULT 0,
                trade_transactions INTEGER DEFAULT 0,
                spam_transactions INTEGER DEFAULT 0,
                
                -- German Tax Calculations (in EUR)
                total_gain_loss_eur DECIMAL(15, 2) DEFAULT 0,
                total_roi_income_eur DECIMAL(15, 2) DEFAULT 0, -- §22 EStG
                speculative_gains_eur DECIMAL(15, 2) DEFAULT 0, -- §23 EStG < 1 Jahr
                long_term_gains_eur DECIMAL(15, 2) DEFAULT 0, -- §23 EStG > 1 Jahr (steuerfrei)
                other_income_eur DECIMAL(15, 2) DEFAULT 0,
                
                -- Tax Calculation Details
                speculation_exemption_used DECIMAL(8, 2) DEFAULT 0, -- 600€ Freigrenze
                total_taxable_income_eur DECIMAL(15, 2) DEFAULT 0,
                estimated_tax_eur DECIMAL(15, 2) DEFAULT 0,
                
                -- File Exports
                pdf_file_path TEXT,
                csv_file_path TEXT,
                elster_xml_path TEXT,
                
                -- Status & Timestamps
                status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'error', 'draft'
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT unique_user_year_type UNIQUE(user_id, report_year, report_type),
                CONSTRAINT valid_year CHECK (report_year >= 2020 AND report_year <= 2030),
                CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'error', 'draft'))
            );
            
            -- =============================================================================
            -- PRICE CACHE & MARKET DATA
            -- =============================================================================
            
            -- Price Cache für historische Preise
            CREATE TABLE IF NOT EXISTS price_cache (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token_address VARCHAR(42) NOT NULL,
                token_symbol VARCHAR(20),
                chain VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE,
                
                -- Prices
                price_usd DECIMAL(15, 8) NOT NULL,
                price_eur DECIMAL(15, 8),
                market_cap_usd DECIMAL(20, 2),
                volume_24h_usd DECIMAL(20, 2),
                
                -- Data Sources
                source VARCHAR(50) NOT NULL, -- 'moralis', 'coingecko', 'coinmarketcap', 'dex'
                confidence_score INTEGER DEFAULT 100, -- 0-100
                
                -- Timestamps
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT unique_token_date_source UNIQUE(token_address, date, source, chain),
                CONSTRAINT positive_price CHECK (price_usd > 0),
                CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 100)
            );
            
            -- DEX Price Data für dezentrale Börsen
            CREATE TABLE IF NOT EXISTS dex_prices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token_address VARCHAR(42) NOT NULL,
                pair_address VARCHAR(42),
                dex_name VARCHAR(50) NOT NULL,
                chain VARCHAR(50) NOT NULL,
                
                -- Price Data
                price_usd DECIMAL(15, 8) NOT NULL,
                liquidity_usd DECIMAL(20, 2),
                volume_24h_usd DECIMAL(20, 2),
                
                -- Timestamp
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                block_number BIGINT,
                
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT valid_dex CHECK (dex_name IN ('uniswap_v2', 'uniswap_v3', 'sushiswap', 'pulsex', '1inch'))
            );
            
            -- =============================================================================
            -- GERMAN TAX SPECIFIC TABLES
            -- =============================================================================
            
            -- German Tax Rules Configuration
            CREATE TABLE IF NOT EXISTS german_tax_rules (
                id SERIAL PRIMARY KEY,
                rule_name VARCHAR(100) UNIQUE NOT NULL,
                tax_year INTEGER NOT NULL,
                rule_type VARCHAR(50) NOT NULL, -- 'speculation_period', 'exemption', 'rate'
                rule_value DECIMAL(15, 2) NOT NULL,
                description TEXT,
                paragraph VARCHAR(20), -- '§22 EStG', '§23 EStG'
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- ROI Classification für automatische Erkennung
            CREATE TABLE IF NOT EXISTS roi_patterns (
                id SERIAL PRIMARY KEY,
                pattern_name VARCHAR(100) NOT NULL,
                pattern_type VARCHAR(50) NOT NULL, -- 'token_symbol', 'contract_address', 'transaction_pattern'
                pattern_value TEXT NOT NULL,
                roi_category VARCHAR(50) NOT NULL, -- 'staking', 'mining', 'dividend', 'airdrop'
                confidence_score INTEGER DEFAULT 100,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- =============================================================================
            -- INDEXE FÜR PERFORMANCE
            -- =============================================================================
            
            -- Tax Wallets Indexe
            CREATE INDEX IF NOT EXISTS idx_tax_wallets_user_id ON tax_wallets(user_id);
            CREATE INDEX IF NOT EXISTS idx_tax_wallets_address ON tax_wallets(wallet_address);
            CREATE INDEX IF NOT EXISTS idx_tax_wallets_chain ON tax_wallets(chain);
            CREATE INDEX IF NOT EXISTS idx_tax_wallets_active ON tax_wallets(is_active) WHERE is_active = true;
            
            -- Crypto Transactions Indexe
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_wallet_id ON crypto_transactions(wallet_id);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_timestamp ON crypto_transactions(timestamp);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_hash ON crypto_transactions(tx_hash);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_token ON crypto_transactions(token_address);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_type ON crypto_transactions(tx_type);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_tax_category ON crypto_transactions(tax_category);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_processed ON crypto_transactions(processed_for_tax);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_roi ON crypto_transactions(is_roi) WHERE is_roi = true;
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_spam ON crypto_transactions(is_spam) WHERE is_spam = false;
            
            -- Composite Indexe für Tax Queries
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_wallet_timestamp ON crypto_transactions(wallet_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_wallet_token_timestamp ON crypto_transactions(wallet_id, token_address, timestamp);
            CREATE INDEX IF NOT EXISTS idx_crypto_tx_tax_relevant ON crypto_transactions(wallet_id, is_tax_relevant, timestamp) WHERE is_tax_relevant = true;
            
            -- Token Holdings Indexe
            CREATE INDEX IF NOT EXISTS idx_token_holdings_wallet_id ON token_holdings(wallet_id);
            CREATE INDEX IF NOT EXISTS idx_token_holdings_token ON token_holdings(token_address);
            CREATE INDEX IF NOT EXISTS idx_token_holdings_updated ON token_holdings(last_updated);
            
            -- FIFO Queue Indexe
            CREATE INDEX IF NOT EXISTS idx_fifo_queue_wallet_token ON fifo_queue(wallet_id, token_address);
            CREATE INDEX IF NOT EXISTS idx_fifo_queue_timestamp ON fifo_queue(buy_timestamp);
            CREATE INDEX IF NOT EXISTS idx_fifo_queue_remaining ON fifo_queue(remaining_amount) WHERE remaining_amount > 0;
            CREATE INDEX IF NOT EXISTS idx_fifo_queue_not_sold ON fifo_queue(is_fully_sold) WHERE is_fully_sold = false;
            
            -- Tax Reports Indexe
            CREATE INDEX IF NOT EXISTS idx_tax_reports_user_id ON tax_reports(user_id);
            CREATE INDEX IF NOT EXISTS idx_tax_reports_year ON tax_reports(report_year);
            CREATE INDEX IF NOT EXISTS idx_tax_reports_status ON tax_reports(status);
            CREATE INDEX IF NOT EXISTS idx_tax_reports_created ON tax_reports(created_at);
            
            -- Tax Report Details Indexe
            CREATE INDEX IF NOT EXISTS idx_tax_report_details_report_id ON tax_report_details(report_id);
            CREATE INDEX IF NOT EXISTS idx_tax_report_details_tx_id ON tax_report_details(transaction_id);
            CREATE INDEX IF NOT EXISTS idx_tax_report_details_taxable ON tax_report_details(is_taxable) WHERE is_taxable = true;
            
            -- Price Cache Indexe
            CREATE INDEX IF NOT EXISTS idx_price_cache_token_date ON price_cache(token_address, date);
            CREATE INDEX IF NOT EXISTS idx_price_cache_date ON price_cache(date);
            CREATE INDEX IF NOT EXISTS idx_price_cache_source ON price_cache(source);
            CREATE INDEX IF NOT EXISTS idx_price_cache_expires ON price_cache(expires_at) WHERE expires_at IS NOT NULL;
            
            -- DEX Prices Indexe
            CREATE INDEX IF NOT EXISTS idx_dex_prices_token ON dex_prices(token_address);
            CREATE INDEX IF NOT EXISTS idx_dex_prices_timestamp ON dex_prices(timestamp);
            CREATE INDEX IF NOT EXISTS idx_dex_prices_dex ON dex_prices(dex_name);
            
            -- =============================================================================
            -- VIEWS FÜR TAX ANALYTICS
            -- =============================================================================
            
            -- View: Tax Overview per User
            CREATE OR REPLACE VIEW user_tax_overview AS
            SELECT 
                u.id as user_id,
                u.email,
                u.subscription_type,
                COUNT(DISTINCT tw.id) as total_wallets,
                COUNT(DISTINCT tr.id) as total_reports,
                COALESCE(SUM(tr.total_taxable_income_eur), 0) as total_taxable_income_eur,
                COALESCE(SUM(tr.estimated_tax_eur), 0) as estimated_tax_eur,
                MAX(tr.completed_at) as last_report_date,
                COUNT(DISTINCT ct.id) as total_transactions
            FROM users u
            LEFT JOIN tax_wallets tw ON u.id = tw.user_id AND tw.is_active = true
            LEFT JOIN tax_reports tr ON u.id = tr.user_id AND tr.status = 'completed'
            LEFT JOIN crypto_transactions ct ON tw.id = ct.wallet_id AND ct.is_tax_relevant = true
            WHERE u.is_active = true
            GROUP BY u.id, u.email, u.subscription_type;
            
            -- View: Active Token Holdings Summary
            CREATE OR REPLACE VIEW active_token_holdings AS
            SELECT 
                tw.user_id,
                tw.wallet_address,
                th.token_symbol,
                th.token_address,
                th.total_amount,
                th.avg_buy_price_eur,
                th.current_value_eur,
                th.unrealized_gain_eur,
                EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - th.first_purchase_date)) as holding_days,
                CASE 
                    WHEN EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - th.first_purchase_date)) >= 365 
                    THEN 'tax_free' 
                    ELSE 'speculative' 
                END as tax_status
            FROM token_holdings th
            JOIN tax_wallets tw ON th.wallet_id = tw.id
            WHERE th.total_amount > 0 AND tw.is_active = true;
            
            -- View: ROI Income Summary
            CREATE OR REPLACE VIEW roi_income_summary AS
            SELECT 
                tw.user_id,
                EXTRACT(YEAR FROM ct.timestamp) as tax_year,
                COUNT(*) as roi_transaction_count,
                SUM(ct.amount_eur) as total_roi_income_eur,
                AVG(ct.amount_eur) as avg_roi_transaction_eur,
                MIN(ct.timestamp) as first_roi_date,
                MAX(ct.timestamp) as last_roi_date
            FROM crypto_transactions ct
            JOIN tax_wallets tw ON ct.wallet_id = tw.id
            WHERE ct.is_roi = true 
              AND ct.is_tax_relevant = true 
              AND ct.is_spam = false
            GROUP BY tw.user_id, EXTRACT(YEAR FROM ct.timestamp);
            
            -- =============================================================================
            -- TRIGGER FUNKTIONEN FÜR TAX SYSTEM
            -- =============================================================================
            
            -- Funktion: Token Holdings automatisch aktualisieren
            CREATE OR REPLACE FUNCTION update_token_holdings()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Bei neuer Transaktion: Holdings entsprechend anpassen
                IF TG_OP = 'INSERT' AND NEW.is_tax_relevant = true THEN
                    INSERT INTO token_holdings (
                        wallet_id, token_address, token_symbol, token_name,
                        total_amount, avg_buy_price_eur, total_invested_eur,
                        first_purchase_date, last_transaction_date
                    ) VALUES (
                        NEW.wallet_id, NEW.token_address, NEW.token_symbol, NEW.token_name,
                        CASE WHEN NEW.tx_type IN ('buy', 'airdrop', 'roi') THEN NEW.amount ELSE 0 END,
                        COALESCE(NEW.amount_eur / NULLIF(NEW.amount, 0), 0),
                        CASE WHEN NEW.tx_type IN ('buy', 'airdrop', 'roi') THEN NEW.amount_eur ELSE 0 END,
                        NEW.timestamp, NEW.timestamp
                    )
                    ON CONFLICT (wallet_id, token_address) DO UPDATE SET
                        total_amount = CASE 
                            WHEN NEW.tx_type IN ('buy', 'airdrop', 'roi') THEN token_holdings.total_amount + NEW.amount
                            WHEN NEW.tx_type IN ('sell', 'swap') THEN GREATEST(0, token_holdings.total_amount - NEW.amount)
                            ELSE token_holdings.total_amount
                        END,
                        last_transaction_date = NEW.timestamp,
                        last_updated = CURRENT_TIMESTAMP;
                END IF;
                
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            -- Funktion: FIFO Queue bei Käufen füllen
            CREATE OR REPLACE FUNCTION update_fifo_queue()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Bei Käufen: FIFO Queue Entry erstellen
                IF TG_OP = 'INSERT' AND NEW.tx_type IN ('buy', 'airdrop', 'roi') AND NEW.is_tax_relevant = true THEN
                    INSERT INTO fifo_queue (
                        wallet_id, token_address, amount, buy_price_usd, buy_price_eur,
                        buy_timestamp, remaining_amount, tx_hash, purchase_tx_id
                    ) VALUES (
                        NEW.wallet_id, NEW.token_address, NEW.amount,
                        COALESCE(NEW.amount_usd / NULLIF(NEW.amount, 0), 0),
                        COALESCE(NEW.amount_eur / NULLIF(NEW.amount, 0), 0),
                        NEW.timestamp, NEW.amount, NEW.tx_hash, NEW.id
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            -- =============================================================================
            -- TRIGGER DEFINITIONEN
            -- =============================================================================
            
            -- Updated At Trigger für Tax Tables
            DROP TRIGGER IF EXISTS update_tax_wallets_updated_at ON tax_wallets;
            CREATE TRIGGER update_tax_wallets_updated_at 
                BEFORE UPDATE ON tax_wallets 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_crypto_transactions_updated_at ON crypto_transactions;
            CREATE TRIGGER update_crypto_transactions_updated_at 
                BEFORE UPDATE ON crypto_transactions 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
            
            -- Token Holdings Update Trigger
            DROP TRIGGER IF EXISTS crypto_transactions_update_holdings ON crypto_transactions;
            CREATE TRIGGER crypto_transactions_update_holdings
                AFTER INSERT ON crypto_transactions
                FOR EACH ROW
                EXECUTE FUNCTION update_token_holdings();
            
            -- FIFO Queue Update Trigger
            DROP TRIGGER IF EXISTS crypto_transactions_update_fifo ON crypto_transactions;
            CREATE TRIGGER crypto_transactions_update_fifo
                AFTER INSERT ON crypto_transactions
                FOR EACH ROW
                EXECUTE FUNCTION update_fifo_queue();
            
            -- =============================================================================
            -- STANDARD TAX RULES EINFÜGEN
            -- =============================================================================
            
            -- Deutsche Steuerregeln für aktuelles Jahr
            INSERT INTO german_tax_rules (rule_name, tax_year, rule_type, rule_value, description, paragraph) VALUES
            ('speculation_period_days', 2024, 'speculation_period', 365, 'Spekulationsfrist für Kryptowährungen', '§23 EStG'),
            ('speculation_exemption_eur', 2024, 'exemption', 600, 'Freigrenze für Spekulationsgeschäfte', '§23 EStG'),
            ('min_income_tax_rate', 2024, 'rate', 14, 'Mindest-Einkommensteuersatz', '§32a EStG'),
            ('max_income_tax_rate', 2024, 'rate', 45, 'Höchst-Einkommensteuersatz', '§32a EStG'),
            ('solidarity_surcharge_rate', 2024, 'rate', 5.5, 'Solidaritätszuschlag', 'SolZG')
            ON CONFLICT (rule_name) DO NOTHING;
            
            -- ROI Pattern für automatische Erkennung
            INSERT INTO roi_patterns (pattern_name, pattern_type, pattern_value, roi_category, confidence_score) VALUES
            ('WGEP Token', 'token_symbol', 'WGEP', 'staking', 95),
            ('MASKMAN Token', 'token_symbol', 'MASKMAN', 'staking', 90),
            ('BORK Token', 'token_symbol', 'BORK', 'staking', 90),
            ('PLSX Token', 'token_symbol', 'PLSX', 'staking', 85),
            ('HEX Token', 'token_symbol', 'HEX', 'staking', 85),
            ('Ethereum Staking', 'transaction_pattern', 'eth_staking_reward', 'staking', 100),
            ('Airdrop Pattern', 'transaction_pattern', 'large_unexpected_transfer', 'airdrop', 80)
            ON CONFLICT (pattern_name) DO NOTHING;
            
            -- =============================================================================
            -- STORED PROCEDURES FÜR TAX CALCULATIONS
            -- =============================================================================
            
            -- Procedure: Calculate FIFO for specific sale
            CREATE OR REPLACE FUNCTION calculate_fifo_sale(
                p_wallet_id UUID,
                p_token_address VARCHAR(42),
                p_sell_amount DECIMAL(36, 18),
                p_sell_price_eur DECIMAL(15, 8),
                p_sell_timestamp TIMESTAMP WITH TIME ZONE
            )
            RETURNS TABLE(
                total_cost_basis_eur DECIMAL(15, 2),
                total_gain_loss_eur DECIMAL(15, 2),
                speculative_gain_eur DECIMAL(15, 2),
                long_term_gain_eur DECIMAL(15, 2),
                avg_holding_days INTEGER
            ) AS $$
            DECLARE
                remaining_sell_amount DECIMAL(36, 18) := p_sell_amount;
                total_cost DECIMAL(15, 2) := 0;
                total_gain DECIMAL(15, 2) := 0;
                spec_gain DECIMAL(15, 2) := 0;
                long_gain DECIMAL(15, 2) := 0;
                total_holding_days INTEGER := 0;
                holding_count INTEGER := 0;
                fifo_entry RECORD;
            BEGIN
                -- FIFO Entries in chronologischer Reihenfolge abarbeiten
                FOR fifo_entry IN
                    SELECT * FROM fifo_queue 
                    WHERE wallet_id = p_wallet_id 
                      AND token_address = p_token_address 
                      AND remaining_amount > 0
                      AND is_fully_sold = false
                    ORDER BY buy_timestamp ASC
                LOOP
                    EXIT WHEN remaining_sell_amount <= 0;
                    
                    DECLARE
                        used_amount DECIMAL(36, 18);
                        cost_basis DECIMAL(15, 2);
                        sale_value DECIMAL(15, 2);
                        gain_loss DECIMAL(15, 2);
                        holding_days INTEGER;
                    BEGIN
                        -- Verwendete Menge bestimmen
                        used_amount := LEAST(remaining_sell_amount, fifo_entry.remaining_amount);
                        
                        -- Kosten und Gewinn berechnen
                        cost_basis := used_amount * fifo_entry.buy_price_eur;
                        sale_value := used_amount * p_sell_price_eur;
                        gain_loss := sale_value - cost_basis;
                        
                        -- Haltedauer berechnen
                        holding_days := EXTRACT(DAYS FROM (p_sell_timestamp - fifo_entry.buy_timestamp));
                        
                        -- Zu Gesamtsummen addieren
                        total_cost := total_cost + cost_basis;
                        total_gain := total_gain + gain_loss;
                        total_holding_days := total_holding_days + holding_days;
                        holding_count := holding_count + 1;
                        
                        -- Deutsche Steuer: Spekulationsfrist prüfen
                        IF holding_days < 365 THEN
                            spec_gain := spec_gain + gain_loss;
                        ELSE
                            long_gain := long_gain + gain_loss;
                        END IF;
                        
                        -- FIFO Entry aktualisieren
                        UPDATE fifo_queue 
                        SET remaining_amount = remaining_amount - used_amount,
                            is_fully_sold = (remaining_amount - used_amount <= 0)
                        WHERE id = fifo_entry.id;
                        
                        -- Verkaufsmenge reduzieren
                        remaining_sell_amount := remaining_sell_amount - used_amount;
                    END;
                END LOOP;
                
                -- Ergebnisse zurückgeben
                RETURN QUERY SELECT 
                    total_cost,
                    total_gain,
                    spec_gain,
                    long_gain,
                    CASE WHEN holding_count > 0 THEN total_holding_days / holding_count ELSE 0 END;
            END;
            $$ LANGUAGE plpgsql;
            
            -- =============================================================================
            -- CLEANUP UND WARTUNG
            -- =============================================================================
            
            -- Procedure: Cleanup alte Price Cache Einträge
            CREATE OR REPLACE FUNCTION cleanup_old_price_cache(retention_days INTEGER DEFAULT 365)
            RETURNS INTEGER AS $$
            DECLARE
                deleted_count INTEGER;
            BEGIN
                DELETE FROM price_cache 
                WHERE date < CURRENT_DATE - (retention_days || ' days')::INTERVAL
                  AND expires_at < CURRENT_TIMESTAMP;
                
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                
                INSERT INTO security_logs (event_type, event_details, severity)
                VALUES ('CLEANUP', jsonb_build_object(
                    'table', 'price_cache',
                    'deleted_rows', deleted_count,
                    'retention_days', retention_days
                ), 'INFO');
                
                RETURN deleted_count;
            END;
            $$ LANGUAGE plpgsql;
            
            -- =============================================================================
            -- ABSCHLUSS
            -- =============================================================================
            
            -- Analyse der neuen Tabellen
            ANALYZE tax_wallets;
            ANALYZE crypto_transactions;
            ANALYZE token_holdings;
            ANALYZE fifo_queue;
            ANALYZE tax_reports;
            ANALYZE tax_report_details;
            ANALYZE price_cache;
            ANALYZE dex_prices;
            ANALYZE german_tax_rules;
            ANALYZE roi_patterns;
            
            -- Success Message
            SELECT 'PulseManager Enhanced Tax Database Schema erfolgreich erstellt!' as status,
                   'Unterstützt deutsches Steuerrecht (§22 & §23 EStG), FIFO-Berechnung und umfassende Tax Reports' as description;
        `;
    }

    /**
     * MongoDB Schema für NoSQL Alternative
     */
    static getMongoDBCollections() {
        return {
            taxWallets: {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["userId", "walletAddress", "chain"],
                        properties: {
                            userId: { bsonType: "string" },
                            walletAddress: { 
                                bsonType: "string",
                                pattern: "^0x[a-fA-F0-9]{40}$"
                            },
                            chain: { 
                                bsonType: "string",
                                enum: ["ethereum", "pulsechain", "polygon", "bsc", "arbitrum"]
                            },
                            label: { bsonType: "string" },
                            isActive: { bsonType: "bool" },
                            walletType: { 
                                bsonType: "string",
                                enum: ["hot", "cold", "exchange"]
                            }
                        }
                    }
                }
            },
            cryptoTransactions: {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["walletId", "txHash", "timestamp", "amount", "txType"],
                        properties: {
                            walletId: { bsonType: "string" },
                            txHash: { bsonType: "string" },
                            timestamp: { bsonType: "date" },
                            amount: { bsonType: "decimal" },
                            txType: {
                                bsonType: "string",
                                enum: ["buy", "sell", "swap", "transfer", "roi", "airdrop", "spam", "fee"]
                            },
                            taxCategory: {
                                bsonType: "string",
                                enum: ["paragraph_22", "paragraph_23", "tax_free", "spam", "pending"]
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Utility: Schema Version Management
     */
    static getSchemaVersion() {
        return {
            version: "1.0.0",
            releaseDate: "2024-06-14",
            description: "Enhanced Tax System Database Schema",
            features: [
                "German Tax Law Compliance (§22 & §23 EStG)",
                "FIFO Calculation Support",
                "Multi-Chain Wallet Management",
                "Comprehensive Tax Reports",
                "Price Cache & Market Data",
                "ROI Pattern Recognition"
            ]
        };
    }
}

module.exports = TaxDatabaseSchemas; 