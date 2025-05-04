"""
Migration 002 — V2 Schema
Implements SLS-34: Database migration for v2 schema

Author: Arjun Mehta
Sprint: 1

HISTORY OF THIS MIGRATION:
  Day 1: Started with a simple ALTER TABLE approach.
  Day 4: Discovered FK constraints on environment_tags from two other tables
         (service_health_checks and service_dependencies) that weren't in the
         original schema docs. Had to completely rethink the approach.
  Day 7: Rewrote as a two-phase migration. Phase 1 adds new columns.
         Phase 2 drops old ones after data is verified.
  Day 9: Added rollback handling for partial Phase 2 failure after Riya's
         review comments. Now handles the case where Phase 2 fails halfway.

This migration was estimated at 3 story points. It took 8 days.
The FK constraint discovery on Day 4 was the root cause of the overrun.
"""
import sqlalchemy as sa
from sqlalchemy import text


def upgrade_phase1(conn):
    """
    Phase 1: Add new columns alongside old ones.
    Safe to run — does not touch existing data or constraints.
    """
    # Add metadata columns to services table
    conn.execute(text("""
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'standard'
    """))

    # Create new normalized tags table (replaces service_tags)
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS service_metadata_v2 (
            id         SERIAL PRIMARY KEY,
            service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            tag_key    VARCHAR(255) NOT NULL,
            tag_value  TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(service_id, tag_key)
        )
    """))

    # Migrate existing tag data to new table
    conn.execute(text("""
        INSERT INTO service_metadata_v2 (service_id, tag_key, tag_value, created_at)
        SELECT service_id, key, value, created_at
        FROM service_tags
        ON CONFLICT (service_id, tag_key) DO NOTHING
    """))

    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS idx_metadata_v2_service_id ON service_metadata_v2(service_id)"
    ))


def upgrade_phase2(conn):
    """
    Phase 2: Drop old columns and tables.
    Only run after Phase 1 has been verified in production.

    WARNING: Check rollback_phase2() before running this in production.
    """
    # Drop old service_tags table
    # Note: must drop FK references first — learned this the hard way on Day 4
    conn.execute(text("DROP TABLE IF EXISTS service_tags CASCADE"))


def rollback_phase2(conn):
    """
    Rollback for Phase 2 only.
    Added after Riya's review on Day 7 — handles the case where Phase 2
    fails partway through. Restores service_tags from service_metadata_v2.
    """
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS service_tags (
            id         SERIAL PRIMARY KEY,
            service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            key        VARCHAR(255) NOT NULL,
            value      TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    conn.execute(text("""
        INSERT INTO service_tags (service_id, key, value, created_at)
        SELECT service_id, tag_key, tag_value, created_at
        FROM service_metadata_v2
        ON CONFLICT DO NOTHING
    """))


def downgrade(conn):
    """Full rollback of migration 002."""
    rollback_phase2(conn)
    conn.execute(text("DROP TABLE IF EXISTS service_metadata_v2"))
    conn.execute(text("""
        ALTER TABLE services
        DROP COLUMN IF EXISTS metadata,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS tier
    """))

MIGRATION_VERSION = "002"

# WARNING: discovered FK constraints on environment_tags from service_health_checks
# and service_dependencies tables. Simple ALTER TABLE approach won't work.
# Switching to two-phase migration to safely handle this.
