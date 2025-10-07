using Google.Cloud.Storage.V1;
using Google.Apis.Auth.OAuth2;
using SashaServer.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace SashaServer.Services
{
    public interface IGoogleCloudService
    {
        // Metode pentru assets bucket (publice)
        Task<FileUploadResult> UploadPropertyPhotoAsync(Stream fileStream, string fileName);
        Task<FileUploadResult> UploadProfilePictureAsync(Stream fileStream, string fileName);
        
        // Metode pentru documents bucket (private)
        Task<FileUploadResult> UploadDocumentAsync(Stream fileStream, string fileName);
        
        // Metode generale cu bucket specificat
        Task<FileUploadResult> UploadFileAsync(Stream fileStream, string fileName, string contentType, string bucketName, Dictionary<string, string>? metadata = null);
        Task<FileUploadResult> UploadBase64FileAsync(string base64String, string fileName, string contentType, string bucketName, Dictionary<string, string>? metadata = null);
        Task<bool> DeleteFileAsync(string fileName, string bucketName);
        Task<CloudFileInfo?> GetFileInfoAsync(string fileName, string bucketName);
        Task<string> GenerateSignedUrlAsync(string fileName, string bucketName, TimeSpan expiration);
        Task<bool> FileExistsAsync(string fileName, string bucketName);
        Task<Stream> DownloadFileAsync(string fileName, string bucketName);
    }

    public class GoogleCloudService : IGoogleCloudService
    {
        private readonly StorageClient _storageClient;
        private readonly CloudConfig _cloudConfig;
        private readonly ILogger<GoogleCloudService> _logger;
        private readonly UrlSigner _urlSigner;

        // Bucket names - actualizează aceste nume conform configurației tale GCP
        private const string ASSETS_BUCKET = "sasha-assets"; // Bucket public pentru imagini
        private const string DOCUMENTS_BUCKET = "sasha-documents"; // Bucket privat pentru documente

       public GoogleCloudService(IOptions<CloudConfig> cloudConfig, ILogger<GoogleCloudService> logger)
{
    _cloudConfig = cloudConfig.Value;
    _logger = logger;

    try
    {
        GoogleCredential credential;
        
        // Verifică dacă CredentialsPath conține JSON direct sau o cale către fișier
        if (string.IsNullOrEmpty(_cloudConfig.CredentialsPath))
        {
            throw new InvalidOperationException("GCP credentials path is not configured");
        }

        // Dacă CredentialsPath începe cu '{', este probabil JSON direct
        if (_cloudConfig.CredentialsPath.Trim().StartsWith('{'))
        {
            _logger.LogInformation("✅ Using GCP credentials from JSON string");
            credential = GoogleCredential.FromJson(_cloudConfig.CredentialsPath);
        }
        // Altfel, verifică dacă este o cale către fișier
        else if (File.Exists(_cloudConfig.CredentialsPath))
        {
            _logger.LogInformation("✅ Using GCP credentials from file: {CredentialsPath}", _cloudConfig.CredentialsPath);
            credential = GoogleCredential.FromFile(_cloudConfig.CredentialsPath);
        }
        else
        {
            // Încearcă să folosească Application Default Credentials
            _logger.LogInformation("✅ Using GCP application default credentials");
            credential = GoogleCredential.GetApplicationDefault();
        }

        _storageClient = StorageClient.Create(credential);
        _urlSigner = UrlSigner.FromCredential(credential);

        _logger.LogInformation(
            "✅ Google Cloud Storage initialized for project: {ProjectId}\n" +
            "   - Assets Bucket: {AssetsBucket}\n" +
            "   - Documents Bucket: {DocumentsBucket}",
            _cloudConfig.ProjectId, _cloudConfig.AssetsBucket, _cloudConfig.BucketName
        );
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "❌ Failed to initialize Google Cloud Storage");
        throw;
    }
}

        // ✅ METODE SPECIALIZATE PENTRU ASSETS BUCKET (PUBLIC)

        public async Task<FileUploadResult> UploadPropertyPhotoAsync(Stream fileStream, string fileName)
        {
            var organizedFileName = $"properties/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}{Path.GetExtension(fileName)}";
            return await UploadFileAsync(fileStream, organizedFileName, "image/jpeg", ASSETS_BUCKET);
        }

        public async Task<FileUploadResult> UploadProfilePictureAsync(Stream fileStream, string fileName)
        {
            var organizedFileName = $"profile-pictures/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}{Path.GetExtension(fileName)}";
            return await UploadFileAsync(fileStream, organizedFileName, "image/jpeg", ASSETS_BUCKET);
        }

        // ✅ METODE SPECIALIZATE PENTRU DOCUMENTS BUCKET (PRIVATE)

        public async Task<FileUploadResult> UploadDocumentAsync(Stream fileStream, string fileName)
        {
            var organizedFileName = $"documents/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}{Path.GetExtension(fileName)}";
            return await UploadFileAsync(fileStream, organizedFileName, GetContentType(fileName), DOCUMENTS_BUCKET);
        }

        // ✅ METODE GENERALE CU BUCKET SPECIFICAT

        public async Task<FileUploadResult> UploadFileAsync(Stream fileStream, string fileName, string contentType, string bucketName, Dictionary<string, string>? metadata = null)
        {
            try
            {
                var uploadObject = new Google.Apis.Storage.v1.Data.Object
                {
                    Bucket = bucketName,
                    Name = fileName,
                    ContentType = contentType,
                    Metadata = metadata
                };

                var result = await _storageClient.UploadObjectAsync(uploadObject, fileStream);

                var fileUrl = $"https://storage.googleapis.com/{bucketName}/{fileName}";

                _logger.LogInformation("✅ File uploaded to {BucketName}: {FileName}, Size: {Size} bytes", 
                    bucketName, fileName, result.Size ?? 0);

                return new FileUploadResult
                {
                    Success = true,
                    FileUrl = fileUrl,
                    FileName = fileName,
                    FileSize = (long)(result.Size ?? 0),
                    ContentType = contentType,
                    BucketName = bucketName
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error uploading file {FileName} to bucket {BucketName}", fileName, bucketName);
                return new FileUploadResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        public async Task<FileUploadResult> UploadBase64FileAsync(string base64String, string fileName, string contentType, string bucketName, Dictionary<string, string>? metadata = null)
        {
            try
            {
                var base64Data = base64String.Contains(",")
                    ? base64String.Split(',')[1]
                    : base64String;

                var fileBytes = Convert.FromBase64String(base64Data);
                using var stream = new MemoryStream(fileBytes);

                return await UploadFileAsync(stream, fileName, contentType, bucketName, metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error uploading base64 file {FileName} to bucket {BucketName}", fileName, bucketName);
                return new FileUploadResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        public async Task<bool> DeleteFileAsync(string fileName, string bucketName)
        {
            try
            {
                await _storageClient.DeleteObjectAsync(bucketName, fileName);
                _logger.LogInformation("🗑️ File deleted from {BucketName}: {FileName}", bucketName, fileName);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error deleting file {FileName} from bucket {BucketName}", fileName, bucketName);
                return false;
            }
        }

        public async Task<CloudFileInfo?> GetFileInfoAsync(string fileName, string bucketName)
        {
            try
            {
                var storageObject = await _storageClient.GetObjectAsync(bucketName, fileName);

                return new CloudFileInfo
                {
                    FileName = storageObject.Name,
                    FileUrl = $"https://storage.googleapis.com/{bucketName}/{storageObject.Name}",
                    FileSize = (long)(storageObject.Size ?? 0),
                    ContentType = storageObject.ContentType,
                    BucketName = bucketName,
                    UploadedAt = storageObject.TimeCreatedDateTimeOffset?.UtcDateTime ?? DateTime.UtcNow,
                    Metadata = storageObject.Metadata != null
                        ? new Dictionary<string, string>(storageObject.Metadata)
                        : new Dictionary<string, string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting file info: {FileName} from bucket {BucketName}", fileName, bucketName);
                return null;
            }
        }

        public async Task<string> GenerateSignedUrlAsync(string fileName, string bucketName, TimeSpan expiration)
        {
            try
            {
                var url = await _urlSigner.SignAsync(
                    bucketName,
                    fileName,
                    expiration,
                    HttpMethod.Get
                );

                _logger.LogInformation("🔑 Signed URL generated for {FileName} from bucket {BucketName}", fileName, bucketName);
                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generating signed URL for {FileName} from bucket {BucketName}", fileName, bucketName);
                throw;
            }
        }

        public async Task<bool> FileExistsAsync(string fileName, string bucketName)
        {
            try
            {
                await _storageClient.GetObjectAsync(bucketName, fileName);
                return true;
            }
            catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error checking if file exists: {FileName} in bucket {BucketName}", fileName, bucketName);
                return false;
            }
        }

        public async Task<Stream> DownloadFileAsync(string fileName, string bucketName)
        {
            try
            {
                _logger.LogInformation("📥 Downloading file from {BucketName}: {FileName}", bucketName, fileName);

                var memoryStream = new MemoryStream();
                
                await _storageClient.DownloadObjectAsync(bucketName, fileName, memoryStream);
                
                memoryStream.Position = 0;
                
                _logger.LogInformation("✅ File downloaded successfully from {BucketName}: {FileName}, Size: {Size} bytes", 
                    bucketName, fileName, memoryStream.Length);
                
                return memoryStream;
            }
            catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("❌ File not found in bucket {BucketName}: {FileName}", bucketName, fileName);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error downloading file {FileName} from bucket {BucketName}", fileName, bucketName);
                return null;
            }
        }

        // ✅ METODĂ PRIVATĂ PENTRU DETERMINAREA CONTENT TYPE
        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }
    }

    // ✅ MODELE ACTUALIZATE CU BUCKET NAME
    public class FileUploadResult
    {
        public bool Success { get; set; }
        public string FileUrl { get; set; }
        public string FileName { get; set; }
        public long FileSize { get; set; }
        public string ContentType { get; set; }
        public string BucketName { get; set; }
        public string ErrorMessage { get; set; }
    }

    public class CloudFileInfo
    {
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public long FileSize { get; set; }
        public string ContentType { get; set; }
        public string BucketName { get; set; }
        public DateTime UploadedAt { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
    }
}