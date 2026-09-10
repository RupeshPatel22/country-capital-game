namespace CountryCapitalApi.Dtos;

/// <summary>
/// Response for a successful <c>POST /api/game/results</c>. Echoes the accepted values
/// plus the server-assigned id and receive timestamp.
/// </summary>
public sealed record GameResultResponseDto(
    Guid Id,
    int ElapsedSeconds,
    int WrongAttempts,
    int HintsUsed,
    DateTimeOffset ReceivedAtUtc);
