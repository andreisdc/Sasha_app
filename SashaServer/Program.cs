using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SashaServer.Data;
using SashaServer.Middleware;
using SashaServer.Services;
using SashaServer.Models;
using Microsoft.Extensions.Options;
using System.Text;
using System;
using Google.Cloud.SecretManager.V1;
using Google.Api.Gax.ResourceNames;
using SashaServer.Helpers;

var builder = WebApplication.CreateBuilder(args);

// --- Google Cloud Secret Manager Configuration ---
try
{
    Console.WriteLine("Initializing Google Cloud Secret Manager...");
    
    // Folosește project ID-ul tău real
    var projectId = "decent-essence-473515-h6";
    Console.WriteLine($"Using project ID: {projectId}");

    // Încarcă secret-ele manual din Google Cloud Secret Manager
    var secrets = LoadSecretsFromGoogleSecretManager(projectId);
    
    // Adaugă secret-ele în configurație
    foreach (var secret in secrets)
    {
        builder.Configuration[secret.Key] = secret.Value;
        Console.WriteLine($"Added to configuration: {secret.Key}");
    }
    
    Console.WriteLine("Google Secret Manager configured successfully");
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to configure Google Secret Manager: {ex.Message}");
    Console.WriteLine("Falling back to local configuration...");
}

// --- Logging ---
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// --- Load configuration ---
Console.WriteLine("Loading configuration...");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var cnpKey = builder.Configuration["CnpKey"];
var jwtKey = builder.Configuration["Jwt-Key"];
var gcsKeyPath = builder.Configuration["gcs-key"];

// Debug: verifică ce valori sunt încărcate
Console.WriteLine($"CnpKey is null or empty: {string.IsNullOrEmpty(cnpKey)}");
Console.WriteLine($"Jwt-Key is null or empty: {string.IsNullOrEmpty(jwtKey)}");
Console.WriteLine($"gcs-key is null or empty: {string.IsNullOrEmpty(gcsKeyPath)}");
Console.WriteLine($"DefaultConnection is null or empty: {string.IsNullOrEmpty(connectionString)}");

// Dacă secret-ele nu sunt încărcate, folosește appsettings.json ca fallback
if (string.IsNullOrEmpty(cnpKey) || string.IsNullOrEmpty(jwtKey))
{
    Console.WriteLine("Secrets not loaded from Google Cloud, using appsettings.json...");
    builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
    
    // Reîncarcă valorile
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    cnpKey = builder.Configuration["CnpKey"];
    jwtKey = builder.Configuration["Jwt-Key"];
    gcsKeyPath = builder.Configuration["gcs-key"];
}

// Verificări finale
if (string.IsNullOrEmpty(jwtKey))
    throw new InvalidOperationException("JWT key not configured.");

if (string.IsNullOrEmpty(cnpKey))
    throw new InvalidOperationException("CNP key not configured.");

if (string.IsNullOrEmpty(gcsKeyPath))
    throw new InvalidOperationException("GCP credentials path not configured.");

if (string.IsNullOrEmpty(connectionString))
    throw new InvalidOperationException("Database connection string not configured.");

Console.WriteLine("All secrets loaded successfully!");

// --- Configure CloudConfig ---
builder.Services.Configure<CloudConfig>(builder.Configuration.GetSection("Gcp"));
builder.Services.AddSingleton(new CnpHelper(cnpKey));

// --- Services ---
builder.Services.AddSingleton<DataMap>();
builder.Services.AddSingleton<IGoogleCloudService, GoogleCloudService>();

builder.Services.AddControllers();

// --- JWT Authentication ---
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

// --- CORS ---
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
app.UseCors("AllowAngular");
app.UseMiddleware<AuthMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// --- Lifetime events ---
app.Lifetime.ApplicationStarted.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer started successfully!", DateTime.Now);
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer is stopping...", DateTime.Now);
});

// --- Run App ---
app.Run();

// --- Funcție pentru încărcarea secret-elor din Google Cloud Secret Manager ---
Dictionary<string, string> LoadSecretsFromGoogleSecretManager(string projectId)
{
    var secrets = new Dictionary<string, string>();
    
    try
    {
        Console.WriteLine($"Attempting to load secrets for project: {projectId}");

        // Folosește clientul simplu - va folosi Application Default Credentials automat
        var client = SecretManagerServiceClient.Create();
        Console.WriteLine("Secret Manager client created successfully");
        
        // Lista de secret-e pe care vrem să le încărcăm
        var secretNames = new[] { "CnpKey", "Jwt-Key", "gcs-key", "DefaultConnection", "EncryptionKeyName" };
        
        foreach (var secretName in secretNames)
        {
            try
            {
                Console.WriteLine($"Loading secret: {secretName}");
                
                // Încearcă să accesezi ultima versiune a secret-ului
                var secretVersionName = new SecretVersionName(projectId, secretName, "latest");
                var result = client.AccessSecretVersion(secretVersionName);
                var secretValue = result.Payload.Data.ToStringUtf8();
                
                secrets[secretName] = secretValue;
                Console.WriteLine($"Successfully loaded secret: {secretName}");
                
                // Dacă este DefaultConnection, adaugă și ca ConnectionString
                if (secretName == "DefaultConnection")
                {
                    secrets["ConnectionStrings:DefaultConnection"] = secretValue;
                    Console.WriteLine("Added DefaultConnection to ConnectionStrings");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to access secret {secretName}: {ex.Message}");
                // Continuă cu următorul secret
            }
        }

        Console.WriteLine($"Total secrets loaded: {secrets.Count}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading secrets from Google Cloud: {ex.Message}");
        throw;
    }
    
    return secrets;
}