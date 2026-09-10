using CountryCapitalApi.Dtos;
using CountryCapitalApi.Models;

namespace CountryCapitalApi.Services;

/// <summary>
/// Owns the country/capital data set and the record of completed games.
/// The single source of truth for game state on the server.
/// </summary>
public interface IGameService
{
    GameDataDto GetGameData();

    GameResult RecordResult(GameResultDto result);
}
