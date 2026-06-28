from rest_framework.permissions import IsAuthenticated


class IsVolunteer(IsAuthenticated):
    """Allow access only to authenticated users with role='volunteer' and a linked TeamMember."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return (
            request.user.role == 'volunteer'
            and hasattr(request.user, 'team_member')
            and request.user.team_member is not None
        )
