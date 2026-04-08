from django.db.models import F
from .models import PointRule, PointTransaction


def award_points(team_member, action_type, description='', reference_id=None, reference_type=''):
    """
    Award points to a team member based on tenant-configured point rules.
    Uses F() expression for atomic increment to avoid race conditions.
    Returns the PointTransaction created, or None if the rule is inactive/missing.
    """
    rule = PointRule.objects.filter(
        tenant=team_member.tenant, action_type=action_type, is_active=True
    ).first()
    if not rule or rule.points == 0:
        return None

    txn = PointTransaction.objects.create(
        tenant=team_member.tenant,
        team_member=team_member,
        action_type=action_type,
        points=rule.points,
        description=description,
        reference_id=reference_id,
        reference_type=reference_type,
    )

    from .models import TeamMember
    TeamMember.objects.filter(pk=team_member.pk).update(
        total_points=F('total_points') + rule.points
    )
    team_member.refresh_from_db(fields=['total_points'])

    return txn


def award_custom_points(team_member, points, action_type, description='', reference_id=None, reference_type=''):
    """
    Award a specific number of points (e.g. view-based content rewards).
    Bypasses PointRule lookup — caller provides the exact amount.
    """
    if points == 0:
        return None

    txn = PointTransaction.objects.create(
        tenant=team_member.tenant,
        team_member=team_member,
        action_type=action_type,
        points=points,
        description=description,
        reference_id=reference_id,
        reference_type=reference_type,
    )

    from .models import TeamMember
    TeamMember.objects.filter(pk=team_member.pk).update(
        total_points=F('total_points') + points
    )
    team_member.refresh_from_db(fields=['total_points'])

    return txn


def seed_default_rules(tenant):
    """Create default point rules for a new tenant."""
    defaults = {
        'register': 50,
        'task_complete': 20,
        'share_content': 10,
        'manual_supporter': 10,
        'link_supporter': 15,
        'event_checkin': 25,
    }
    for action_type, pts in defaults.items():
        PointRule.objects.get_or_create(
            tenant=tenant, action_type=action_type,
            defaults={'points': pts, 'is_active': True},
        )
