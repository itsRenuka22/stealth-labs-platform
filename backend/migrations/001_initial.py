"""
Migration 001 — Initial Schema
Implements SLS-28: Service registry data model and schema

Author: Arjun Mehta
Sprint: 1

Note: Used JSONB for environment_tags to stay flexible.
Took longer than expected to decide on the indexing strategy.
"""
import sqlalchemy as sa
from sqlalchemy import text

def upgrade(conn):
    """Create the initial services_registry schema."""

    # Main services table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS services (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(255) NOT NULL UNIQUE,
            owner_team  VARCHAR(255) NOT NULL,
            repo_url    TEXT NOT NULL,
            language    VARCHAR(100) NOT NULL,
            description TEXT,
            environment VARCHAR(50) NOT NULL DEFAULT 'production',
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))

    # Environment tags stored as JSONB for flexibility
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS service_tags (
            id         SERIAL PRIMARY KEY,
            service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            key        VARCHAR(255) NOT NULL,
            value      TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))

    # Index for common query patterns
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_services_owner_team ON services(owner_team)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_services_language ON services(language)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_service_tags_service_id ON service_tags(service_id)"))


def downgrade(conn):
    """Roll back the initial schema."""
    conn.execute(text("DROP TABLE IF EXISTS service_tags"))
    conn.execute(text("DROP TABLE IF EXISTS services"))

# Schema design choices (SLS-28):
# - services table holds core registry metadata
# - service_tags uses key-value pairs for flexible metadata
# - indexes on owner_team and language for common query patterns

    # CREATE INDEX idx_services_updated_at ON services(updated_at);
