using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SashaServer.Data;
using SashaServer.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddSingleton<DataMap>();
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

var logger = app.Logger;
logger.LogInformation("[{Time}] SashaServer starting...", DateTime.Now);

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");

app.UseMiddleware<AuthMiddleware>();

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer started successfully!", DateTime.Now);
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer is stopping...", DateTime.Now);
});

app.Run();
