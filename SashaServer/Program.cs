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
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// --- Încarcă appsettings.json PRIMUL ---
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

// --- Google Cloud Secret Manager Configuration ---
try
{
    Console.WriteLine("Initializing Google Cloud Secret Manager...");
    
    var projectId = "decent-essence-473515-h6";
    Console.WriteLine($"Using project ID: {projectId}");

    // Încarcă secret-ele manual din Google Cloud Secret Manager
    var secrets = LoadSecretsFromGoogleSecretManager(projectId);
    
    // Adaugă secret-ele în configurație DOAR dacă nu sunt deja setate
    foreach (var secret in secrets)
    {
        if (string.IsNullOrEmpty(builder.Configuration[secret.Key]))
        {
            builder.Configuration[secret.Key] = secret.Value;
            Console.WriteLine($"Added to configuration from Secret Manager: {secret.Key}");
        }
        else
        {
            Console.WriteLine($"Configuration {secret.Key} already set, skipping Secret Manager");
        }
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

// Încarcă configurația GCP din secțiunea Gcp din appsettings.json
var gcpConfig = builder.Configuration.GetSection("Gcp");
var projectIdFromConfig = gcpConfig["ProjectId"];
var bucketName = gcpConfig["BucketName"];
var credentialsPath = gcpConfig["CredentialsPath"];
var assetsBucket = gcpConfig["AssetsBucket"];

// Debug: verifică ce valori sunt încărcate
Console.WriteLine($"CnpKey is null or empty: {string.IsNullOrEmpty(cnpKey)}");
Console.WriteLine($"Jwt-Key is null or empty: {string.IsNullOrEmpty(jwtKey)}");
Console.WriteLine($"gcs-key is null or empty: {string.IsNullOrEmpty(gcsKeyPath)}");
Console.WriteLine($"DefaultConnection is null or empty: {string.IsNullOrEmpty(connectionString)}");
Console.WriteLine($"GCP AssetsBucket from appsettings: {assetsBucket}");

// Dacă gcsKeyPath conține JSON (începe cu '{'), salvează-l într-un fișier temporar
if (!string.IsNullOrEmpty(gcsKeyPath) && gcsKeyPath.Trim().StartsWith('{'))
{
    var tempCredentialsPath = Path.Combine(Path.GetTempPath(), $"gcp-credentials-{Guid.NewGuid()}.json");
    try
    {
        File.WriteAllText(tempCredentialsPath, gcsKeyPath);
        gcsKeyPath = tempCredentialsPath;
        Console.WriteLine($"Saved GCP credentials to temporary file: {tempCredentialsPath}");
        
        // Verifică dacă fișierul a fost creat cu succes
        if (File.Exists(tempCredentialsPath))
        {
            Console.WriteLine("Temporary credentials file created successfully");
        }
        else
        {
            Console.WriteLine("Warning: Temporary credentials file was not created");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error saving temporary credentials file: {ex.Message}");
        // Continuă cu JSON-ul direct, serviciul GoogleCloudService va gestiona
    }
}

// Verificări pentru valori critice
if (string.IsNullOrEmpty(jwtKey))
    throw new InvalidOperationException("JWT key not configured.");

if (string.IsNullOrEmpty(cnpKey))
    throw new InvalidOperationException("CNP key not configured.");

// Folosește GCP credentials path din appsettings.json dacă nu este setat din Secret Manager
if (string.IsNullOrEmpty(gcsKeyPath) && !string.IsNullOrEmpty(credentialsPath))
{
    gcsKeyPath = credentialsPath;
    Console.WriteLine($"Using GCP credentials path from appsettings: {gcsKeyPath}");
}

if (string.IsNullOrEmpty(gcsKeyPath))
    throw new InvalidOperationException("GCP credentials path not configured.");

if (string.IsNullOrEmpty(connectionString))
    throw new InvalidOperationException("Database connection string not configured.");

// ✅ Configurează bucket-ul pentru assets - folosește valoarea din appsettings.json
if (string.IsNullOrEmpty(assetsBucket))
{
    assetsBucket = "sasha-stays-documents"; // Fallback
    Console.WriteLine("Using fallback bucket: sasha-stays-documents");
}

Console.WriteLine($"Assets bucket configured: {assetsBucket}");
Console.WriteLine($"GCP credentials path: {gcsKeyPath}");
Console.WriteLine("All configuration loaded successfully!");

// --- Configure CloudConfig ---
builder.Services.Configure<CloudConfig>(options =>
{
    options.ProjectId = projectIdFromConfig ?? "decent-essence-473515-h6";
    options.BucketName = bucketName ?? "sasha-stays-documents";
    options.CredentialsPath = gcsKeyPath; // Folosește calea din configurație (sau JSON direct)
    options.AssetsBucket = assetsBucket;
});

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
    logger.LogInformation("[{Time}] Assets bucket: {Bucket}", DateTime.Now, assetsBucket);
    logger.LogInformation("[{Time}] GCP Credentials: {Path}", DateTime.Now, gcsKeyPath);
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer is stopping...", DateTime.Now);
    
    // Curăță fișierele temporare de credentials dacă există
    try
    {
        if (gcsKeyPath.Contains("gcp-credentials-") && File.Exists(gcsKeyPath))
        {
            File.Delete(gcsKeyPath);
            Console.WriteLine("Cleaned up temporary credentials file");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Could not clean up temporary credentials file: {ex.Message}");
    }
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

        var client = SecretManagerServiceClient.Create();
        Console.WriteLine("Secret Manager client created successfully");
        
        // ✅ Lista de secret-e - elimină sasha-stays-assets-bucket deoarece nu există
        var secretNames = new[] { 
            "CnpKey", "Jwt-Key", "gcs-key", "DefaultConnection", 
            "EncryptionKeyName"
            // sasha-stays-assets-bucket a fost eliminat deoarece nu există
        };
        
        foreach (var secretName in secretNames)
        {
            try
            {
                Console.WriteLine($"Loading secret: {secretName}");
                
                var secretVersionName = new SecretVersionName(projectId, secretName, "latest");
                var result = client.AccessSecretVersion(secretVersionName);
                var secretValue = result.Payload.Data.ToStringUtf8();
                
                secrets[secretName] = secretValue;
                Console.WriteLine($"Successfully loaded secret: {secretName}");
                
                if (secretName == "DefaultConnection")
                {
                    secrets["ConnectionStrings:DefaultConnection"] = secretValue;
                    Console.WriteLine("Added DefaultConnection to ConnectionStrings");
                }
            }
            catch (Grpc.Core.RpcException ex) when (ex.StatusCode == Grpc.Core.StatusCode.NotFound)
            {
                Console.WriteLine($"Secret {secretName} not found in Secret Manager - this is OK, using appsettings.json");
                // Nu aruncă excepție, doar continuă
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
        // Nu aruncă excepție, permite fallback la appsettings.json
    }
    
    return secrets;
}   