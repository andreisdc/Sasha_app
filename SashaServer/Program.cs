using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SashaServer.Data;
using SashaServer.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// --- Build the WebApplication ---
var builder = WebApplication.CreateBuilder(args);

// --- Logging ---
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// --- Configuration ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(connectionString))
    throw new InvalidOperationException("Database connection string is not configured.");
if (string.IsNullOrEmpty(jwtKey))
    throw new InvalidOperationException("JWT Key is not configured.");

// --- Services ---
builder.Services.AddSingleton<DataMap>(); // In-memory data store
builder.Services.AddControllers();

// JWT Authentication setup (optional, if you use JWT)
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// --- Configure CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // front-end Angular
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // must allow credentials for cookie
    });
});

// --- Build App ---
var app = builder.Build();

// --- Logger ---
var logger = app.Logger;
logger.LogInformation("[{Time}] SashaServer starting...", DateTime.Now);

// --- Middleware pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

// Apply CORS
app.UseCors("AllowAngular");

// --- Important: AuthMiddleware must run BEFORE Authorization ---
app.UseMiddleware<AuthMiddleware>();

// Apply Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// --- Application Lifetime Events ---
app.Lifetime.ApplicationStarted.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer started successfully!", DateTime.Now);
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer is stopping...", DateTime.Now);
});

// --- Run the app ---
app.Run();
