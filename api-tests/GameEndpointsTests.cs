using System.Net;
using System.Net.Http.Json;
using CountryCapitalApi.Dtos;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CountryCapitalApi.Tests;

/// <summary>
/// Verifies the wire contract of both endpoints in-process: status codes, DTO shape
/// and input validation.
/// </summary>
public sealed class GameEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;

    public GameEndpointsTests(WebApplicationFactory<Program> factory)
    {
        this.factory = factory;
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async Task GetGame_Returns200_WithPairs()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/game");
        var body = await response.Content.ReadFromJsonAsync<GameDataDto>();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.NotEmpty(body!.Pairs);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async Task PostResults_Returns201_WithLocationAndBody_WhenValid()
    {
        // Arrange
        var client = factory.CreateClient();
        var submission = new GameResultDto { ElapsedSeconds = 42, WrongAttempts = 3, HintsUsed = 1 };

        // Act
        var response = await client.PostAsJsonAsync("/api/game/results", submission);
        var body = await response.Content.ReadFromJsonAsync<GameResultResponseDto>();

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body!.Id);
        Assert.Equal(42, body.ElapsedSeconds);
    }

    [Theory]
    [Trait("TestType", "Integration")]
    [InlineData(-1, 0, 0)]
    [InlineData(0, -5, 0)]
    [InlineData(0, 0, -2)]
    public async Task PostResults_Returns400_WhenAnyValueIsNegative(int elapsed, int wrong, int hints)
    {
        // Arrange
        var client = factory.CreateClient();
        var submission = new GameResultDto { ElapsedSeconds = elapsed, WrongAttempts = wrong, HintsUsed = hints };

        // Act
        var response = await client.PostAsJsonAsync("/api/game/results", submission);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async Task PostResults_Returns400_WhenBodyIsMalformed()
    {
        // Arrange
        var client = factory.CreateClient();
        var content = new StringContent("{ not json", System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/game/results", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
