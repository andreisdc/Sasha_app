using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SashaServer.Data;

var builder = WebApplication.CreateBuilder(args);

// Add logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Add DataMap as a service
builder.Services.AddScoped<DataMap>();

// Add controllers
builder.Services.AddControllers();

var app = builder.Build();

var logger = app.Logger;
logger.LogInformation("[{Time}] Backend starting...", DateTime.Now);

// Middleware
app.UseHttpsRedirection();

// Map controllers
app.MapControllers();

app.Run();
