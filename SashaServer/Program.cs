using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SashaServer.Data;
using SashaServer.Services;
using SashaServer.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Services
builder.Services.AddSingleton<DataMap>();
builder.Services.AddSingleton<AuthService>();

// Controllers
builder.Services.AddControllers();

var app = builder.Build();

var logger = app.Logger;
logger.LogInformation("[{Time}] SashaServer starting...", DateTime.Now);

// Middleware
app.UseHttpsRedirection();
app.UseMiddleware<AuthMiddleware>();

// Map controllers
app.MapControllers();

// Startup and shutdown logging
app.Lifetime.ApplicationStarted.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer started successfully!", DateTime.Now);
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer is stopping...", DateTime.Now);
});

app.Run();
