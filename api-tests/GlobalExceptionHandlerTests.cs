using System.Net;
using CountryCapitalApi.Dtos;
using CountryCapitalApi.Models;
using CountryCapitalApi.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CountryCapitalApi.Tests;

/// <summary>
/// Verifies an exception no controller handles is turned into a clean 500
/// <c>application/problem+json</c> response with no leaked exception detail.
/// </summary>
public sealed class GlobalExceptionHandlerTests
{
    [Fact]
    [Trait("TestType", "Integration")]
    public async Task UnhandledException_Returns500ProblemDetails_WithoutLeakingDetail()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IGameService>();
                services.AddSingleton<IGameService, ThrowingGameService>();
            });
        });
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/game");
        var body = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("An unexpected error occurred.", body);
        Assert.DoesNotContain(ThrowingGameService.Message, body);
    }

    private sealed class ThrowingGameService : IGameService
    {
        public const string Message = "storage layer unavailable";

        public GameDataDto GetGameData() => throw new InvalidOperationException(Message);

        public GameResult RecordResult(GameResultDto result) =>
            throw new InvalidOperationException(Message);
    }
}
