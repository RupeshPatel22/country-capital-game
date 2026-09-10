using CountryCapitalApi.Dtos;
using CountryCapitalApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CountryCapitalApi.Controllers;

/// <summary>
/// Endpoints the Angular country/capital game consumes: fetching the data set and
/// submitting a completed game's stats.
/// </summary>
[ApiController]
[Route("api/game")]
[Produces("application/json")]
public sealed class GameController : ControllerBase
{
    private readonly IGameService gameService;

    public GameController(IGameService gameService)
    {
        this.gameService = gameService;
    }

    /// <summary>Returns the country/capital pairs used to build the board.</summary>
    /// <response code="200">The data set.</response>
    [HttpGet]
    [ProducesResponseType(typeof(GameDataDto), StatusCodes.Status200OK)]
    public ActionResult<GameDataDto> GetGameData()
    {
        return Ok(gameService.GetGameData());
    }

    /// <summary>Records the stats for a completed game.</summary>
    /// <response code="201">The submission was stored.</response>
    /// <response code="400">One or more values were missing or negative.</response>
    [HttpPost("results")]
    [ProducesResponseType(typeof(GameResultResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public ActionResult<GameResultResponseDto> SubmitResult(GameResultDto result)
    {
        var record = gameService.RecordResult(result);

        var response = new GameResultResponseDto(
            record.Id,
            record.ElapsedSeconds,
            record.WrongAttempts,
            record.HintsUsed,
            record.ReceivedAtUtc);

        return Created($"/api/game/results/{response.Id}", response);
    }
}
