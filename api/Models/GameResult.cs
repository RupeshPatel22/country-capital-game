namespace CountryCapitalApi.Models;

/// <summary>
/// Internal domain model for a completed game submission. The server owns
/// <see cref="Id"/> and <see cref="ReceivedAtUtc"/>; the client never supplies them.
/// </summary>
public sealed record GameResult(
    Guid Id,
    int ElapsedSeconds,
    int WrongAttempts,
    int HintsUsed,
    DateTimeOffset ReceivedAtUtc);
