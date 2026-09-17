"""
Indianvoice.ai — Conversation States
Defines the explicit state enum for the sales agent conversation flow.
"""
from enum import Enum, auto


class SalesState(Enum):
    INTRODUCTION = auto()
    QUALIFICATION = auto()
    DISCOVERY = auto()
    VALUE_PROPOSITION = auto()
    OBJECTION_HANDLING = auto()
    CLOSING = auto()
    SCHEDULING = auto()
    HUMAN_HANDOFF = auto()
    END = auto()
