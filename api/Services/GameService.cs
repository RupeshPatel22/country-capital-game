using System.Collections.Concurrent;
using CountryCapitalApi.Dtos;
using CountryCapitalApi.Models;

namespace CountryCapitalApi.Services;

/// <summary>
/// In-memory implementation of <see cref="IGameService"/>. Registered as a singleton so
/// the recorded results survive between requests for the lifetime of the process.
/// </summary>
public sealed class GameService : IGameService
{
    private static readonly IReadOnlyList<CountryCapitalPair> Pairs =
    [
        new("Germany", "Berlin"),
        new("Azerbaijan", "Baku"),
        new("Poland", "Warsaw"),
        new("Papua New Guinea", "Port Moresby"),
        new("Japan", "Tokyo"),
        new("Peru", "Lima"),
    ];

    private readonly ConcurrentQueue<GameResult> results = new();

    public GameDataDto GetGameData()
    {
        var map = Pairs.ToDictionary(pair => pair.Country, pair => pair.Capital);
        return new GameDataDto(map);
    }

    public GameResult RecordResult(GameResultDto result)
    {
        var record = new GameResult(
            Id: Guid.NewGuid(),
            ElapsedSeconds: result.ElapsedSeconds,
            WrongAttempts: result.WrongAttempts,
            HintsUsed: result.HintsUsed,
            ReceivedAtUtc: DateTimeOffset.UtcNow);

        results.Enqueue(record);
        return record;
    }
}
