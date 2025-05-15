"""
Health Check Scheduler
Implements SLS-42: Health check scheduler (cron)

Author: Arjun Mehta
Sprint: 2

Runs health checks for all registered services every 5 minutes.
Uses APScheduler. Failures are logged and skipped — does not crash
the scheduler if a single service check fails.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def start_scheduler(services_getter, health_checker):
    """
    Start the health check scheduler.

    Args:
        services_getter: async callable that returns list of services
        health_checker: async callable(service_id, url) that runs a check
    """
    async def run_all_checks():
        services = await services_getter()
        for service in services:
            try:
                await health_checker(
                    service_id=service["id"],
                    url=service.get("health_url", f"http://{service['name']}/health"),
                )
            except Exception as e:
                logger.warning(
                    "Health check failed for service %s: %s",
                    service.get("name"), str(e)
                )

    scheduler.add_job(
        run_all_checks,
        trigger=IntervalTrigger(minutes=5),
        id="health_check_all",
        replace_existing=True,
        misfire_grace_time=60,
    )
    scheduler.start()
    logger.info("Health check scheduler started — running every 5 minutes")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Health check scheduler stopped")

SCHEDULER_INTERVAL_MINUTES = 5
SCHEDULER_MISFIRE_GRACE_SECONDS = 60
