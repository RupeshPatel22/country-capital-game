using System.ComponentModel.DataAnnotations;

namespace CountryCapitalApi.Dtos;

/// <summary>
/// Request body for <c>POST /api/game/results</c>. Every field must be zero or greater;
/// the <see cref="RangeAttribute"/> checks are enforced automatically by
/// <c>[ApiController]</c> model validation, which returns 400 for any violation.
/// </summary>
public sealed record GameResultDto
{
    [Range(0, int.MaxValue, ErrorMessage = "elapsedSeconds must be zero or greater.")]
    public int ElapsedSeconds { get; init; }

    [Range(0, int.MaxValue, ErrorMessage = "wrongAttempts must be zero or greater.")]
    public int WrongAttempts { get; init; }

    [Range(0, int.MaxValue, ErrorMessage = "hintsUsed must be zero or greater.")]
    public int HintsUsed { get; init; }
}
