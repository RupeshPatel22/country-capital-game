namespace CountryCapitalApi.Dtos;

/// <summary>
/// Response for <c>GET /api/game</c>. <see cref="Pairs"/> maps country name to capital
/// name, which is exactly the shape the Angular component's <c>data</c> input expects.
/// </summary>
public sealed record GameDataDto(IReadOnlyDictionary<string, string> Pairs);
