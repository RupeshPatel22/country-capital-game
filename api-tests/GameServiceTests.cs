using CountryCapitalApi.Dtos;
using CountryCapitalApi.Services;

namespace CountryCapitalApi.Tests;

public sealed class GameServiceTests
{
    [Fact]
    [Trait("TestType", "Unit")]
    public void GetGameData_ReturnsNonEmptyPairs_WithCapitalsAsValues()
    {
        // Arrange
        var service = new GameService();

        // Act
        var data = service.GetGameData();

        // Assert
        Assert.NotEmpty(data.Pairs);
        Assert.Equal("Berlin", data.Pairs["Germany"]);
    }

    [Fact]
    [Trait("TestType", "Unit")]
    public void RecordResult_AssignsIdAndTimestamp_AndEchoesValues()
    {
        // Arrange
        var service = new GameService();
        var submission = new GameResultDto { ElapsedSeconds = 30, WrongAttempts = 2, HintsUsed = 1 };

        // Act
        var record = service.RecordResult(submission);

        // Assert
        Assert.NotEqual(Guid.Empty, record.Id);
        Assert.NotEqual(default, record.ReceivedAtUtc);
        Assert.Equal(30, record.ElapsedSeconds);
        Assert.Equal(2, record.WrongAttempts);
        Assert.Equal(1, record.HintsUsed);
    }
}
