using Google.Cloud.SecretManager.V1;
using Google.Apis.Auth.OAuth2;

public static class SecretManagerExtensions
{
    public static void AddGcpSecrets(this WebApplicationBuilder builder)
    {
        SecretManagerServiceClient secretClient;

        try
        {
            if (builder.Environment.IsDevelopment())
            {
                // ✅ Local development: folosește key.json explicit
                var credential = GoogleCredential.FromFile("/Users/Secrets/key-1.json");
                secretClient = new SecretManagerServiceClientBuilder
                {
                    Credential = credential
                }.Build();
                Console.WriteLine("Loaded GCP secrets using local key.json");
            }
            else
            {
                // ✅ Production (Cloud Run, GKE, VM cu Service Account): folosește ADC
                secretClient = SecretManagerServiceClient.Create();
                Console.WriteLine("Loaded GCP secrets using Application Default Credentials (ADC)");
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to initialize SecretManagerServiceClient", ex);
        }

        var secrets = new Dictionary<string, string>
        {
            { "DefaultConnection", "ConnectionStrings:DefaultConnection" },
            { "Jwt-Key", "Jwt:Key" }
        };

        var projectId = builder.Configuration["Gcp:ProjectId"];
        if (string.IsNullOrEmpty(projectId))
            throw new InvalidOperationException("Gcp:ProjectId is not configured.");

        foreach (var kvp in secrets)
        {
            try
            {
                var secretName = new SecretVersionName(projectId, kvp.Key, "latest");
                var response = secretClient.AccessSecretVersion(secretName);
                var value = response.Payload.Data.ToStringUtf8();

                builder.Configuration[kvp.Value] = value;
                Console.WriteLine($"Loaded secret {kvp.Key} into configuration {kvp.Value}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load secret {kvp.Key}: {ex.Message}");
            }
        }
    }
}
