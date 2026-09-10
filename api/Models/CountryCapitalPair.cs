namespace CountryCapitalApi.Models;

/// <summary>
/// Internal domain model for a single country/capital pair. Kept separate from the
/// response DTO so the wire contract can change without touching game data.
/// </summary>
public sealed record CountryCapitalPair(string Country, string Capital);
