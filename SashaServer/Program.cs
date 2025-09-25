using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SashaServer.Data;
using SashaServer.Services;
using SashaServer.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---------------- LOGGING ----------------
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// ---------------- SERVICES ----------------
builder.Services.AddSingleton<DataMap>();
builder.Services.AddSingleton<AuthService>();

// Controllers
builder.Services.AddControllers();

// ✅ Add CORS policy for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Angular dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ✅ JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

var app = builder.Build();

// ---------------- PIPELINE ----------------
var logger = app.Logger;
logger.LogInformation("[{Time}] SashaServer starting...", DateTime.Now);

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// ✅ Enable HTTPS redirection
app.UseHttpsRedirection();

// ✅ Enable CORS before auth
app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

// Custom middleware
app.UseMiddleware<AuthMiddleware>();

// Controllers
app.MapControllers();

// ---------------- LIFETIME LOGGING ----------------
app.Lifetime.ApplicationStarted.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer started successfully!", DateTime.Now);
});

app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("[{Time}] SashaServer is stopping...", DateTime.Now);
});

app.Run();
