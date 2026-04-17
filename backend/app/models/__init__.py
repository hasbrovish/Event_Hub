"""ORM models — mirrors reference_docs/db_design.md PostgreSQL DDL."""

from app.models.approval import ApprovalRequest
from app.models.audit_log import AuditLog
from app.models.campaign import Campaign
from app.models.employee import Employee, EmployeeRole
from app.models.event import Event
from app.models.event_session import EventSession
from app.models.group import Group, GroupAdmin
from app.models.notification import Notification
from app.models.preference import Preference
from app.models.registration import Registration

__all__ = [
    "ApprovalRequest",
    "AuditLog",
    "Campaign",
    "Employee",
    "EmployeeRole",
    "Event",
    "EventSession",
    "Group",
    "GroupAdmin",
    "Notification",
    "Preference",
    "Registration",
]
