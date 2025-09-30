using Google.Cloud.Storage.V1;
using Google.Apis.Auth.OAuth2;
using SashaServer.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace SashaServer.Services
{
    public interface IGoogleCloudService
    {
        Task<FileUploadResult> UploadFileAsync(Stream fileStream, string fileName, string contentType, Dictionary<string, string>? metadata = null);
        Task<FileUploadResult> UploadBase64FileAsync(string base64String, string fileName, string contentType, Dictionary<string, string>? metadata = null);
        Task<bool> DeleteFileAsync(string fileName);
        Task<CloudFileInfo?> GetFileInfoAsync(string fileName);
        Task<string> GenerateSignedUrlAsync(string fileName, TimeSpan expiration);
        Task<bool> FileExistsAsync(string fileName);
    }

    public class GoogleCloudService : IGoogleCloudService
    {
        private readonly StorageClient _storageClient;
        private readonly CloudConfig _cloudConfig;
        private readonly ILogger<GoogleCloudService> _logger;
        private readonly UrlSigner _urlSigner;

        public GoogleCloudService(IOptions<CloudConfig> cloudConfig, ILogger<GoogleCloudService> logger)
        {
            _cloudConfig = cloudConfig.Value;
            _logger = logger;

            try
            {
                // Verifică dacă calea către credentials există
                if (string.IsNullOrEmpty(_cloudConfig.CredentialsPath))
                {
                    throw new InvalidOperationException("GCP credentials path is not configured");
                }

                if (!File.Exists(_cloudConfig.CredentialsPath))
                {
                    throw new FileNotFoundException($"GCP credentials file not found at: {_cloudConfig.CredentialsPath}");
                }

                var credential = GoogleCredential.FromFile(_cloudConfig.CredentialsPath);
                _storageClient = StorageClient.Create(credential);
                _urlSigner = UrlSigner.FromCredential(credential);
                
                _logger.LogInformation("Google Cloud Storage initialized for project: {ProjectId}, bucket: {BucketName}", 
                    _cloudConfig.ProjectId, _cloudConfig.BucketName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Google Cloud Storage");
                throw;
            }
        }

        public async Task<FileUploadResult> UploadFileAsync(Stream fileStream, string fileName, string contentType, Dictionary<string, string>? metadata = null)
        {
            try
            {
                // Generate unique filename to avoid collisions
                var uniqueFileName = GenerateUniqueFileName(fileName);
                
                var objectName = $"uploads/{DateTime.UtcNow:yyyy/MM/dd}/{uniqueFileName}";

                var uploadObject = new Google.Apis.Storage.v1.Data.Object
                {
                    Bucket = _cloudConfig.BucketName,
                    Name = objectName,
                    ContentType = contentType,
                    Metadata = metadata
                };

                var result = await _storageClient.UploadObjectAsync(
                    uploadObject,
                    fileStream
                );

                var fileUrl = $"{_cloudConfig.BaseUrl}/{_cloudConfig.BucketName}/{objectName}";

                _logger.LogInformation("File uploaded successfully: {FileName} -> {ObjectName}, Size: {Size} bytes", 
                    fileName, objectName, result.Size ?? 0);

                return new FileUploadResult
                {
                    Success = true,
                    FileUrl = fileUrl,
                    FileName = objectName,
                    FileSize = (long)(result.Size ?? 0),
                    ContentType = contentType
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to Google Cloud Storage", fileName);
                return new FileUploadResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<FileUploadResult> UploadBase64FileAsync(string base64String, string fileName, string contentType, Dictionary<string, string>? metadata = null)
        {
            try
            {
                // Remove data URL prefix if present
                var base64Data = base64String.Contains(",") 
                    ? base64String.Split(',')[1] 
                    : base64String;

                var fileBytes = Convert.FromBase64String(base64Data);
                using var stream = new MemoryStream(fileBytes);

                return await UploadFileAsync(stream, fileName, contentType, metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading base64 file {FileName} to Google Cloud Storage", fileName);
                return new FileUploadResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<bool> DeleteFileAsync(string fileName)
        {
            try
            {
                await _storageClient.DeleteObjectAsync(_cloudConfig.BucketName, fileName);
                _logger.LogInformation("File deleted successfully: {FileName}", fileName);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileName} from Google Cloud Storage", fileName);
                return false;
            }
        }

        public async Task<CloudFileInfo?> GetFileInfoAsync(string fileName)
        {
            try
            {
                var storageObject = await _storageClient.GetObjectAsync(_cloudConfig.BucketName, fileName);
                
                return new CloudFileInfo
                {
                    FileName = storageObject.Name,
                    FileUrl = $"{_cloudConfig.BaseUrl}/{_cloudConfig.BucketName}/{storageObject.Name}",
                    FileSize = (long)(storageObject.Size ?? 0),
                    ContentType = storageObject.ContentType,
                    UploadedAt = storageObject.TimeCreatedDateTimeOffset?.UtcDateTime ?? DateTime.UtcNow,
                    Metadata = storageObject.Metadata != null 
                        ? new Dictionary<string, string>(storageObject.Metadata)
                        : new Dictionary<string, string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting file info for {FileName}", fileName);
                return null;
            }
        }

        public async Task<string> GenerateSignedUrlAsync(string fileName, TimeSpan expiration)
        {
            try
            {
                var url = await _urlSigner.SignAsync(
                    _cloudConfig.BucketName,
                    fileName,
                    expiration,
                    HttpMethod.Get
                );

                _logger.LogInformation("Generated signed URL for {FileName}, expires in {Expiration}", fileName, expiration);
                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating signed URL for {FileName}", fileName);
                throw;
            }
        }

        public async Task<bool> FileExistsAsync(string fileName)
        {
            try
            {
                await _storageClient.GetObjectAsync(_cloudConfig.BucketName, fileName);
                return true;
            }
            catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if file exists: {FileName}", fileName);
                return false;
            }
        }

        private string GenerateUniqueFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
            
            // Sanitize filename
            var sanitizedFileName = string.Join("_", fileNameWithoutExtension.Split(Path.GetInvalidFileNameChars()));
            
            // Truncate if too long
            if (sanitizedFileName.Length > 50)
            {
                sanitizedFileName = sanitizedFileName.Substring(0, 50);
            }
            
            return $"{sanitizedFileName}_{Guid.NewGuid():N}{extension}";
        }
    }

    public class FileUploadResult
    {
        public bool Success { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public long FileSize { get; set; }
        public string? ContentType { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class CloudFileInfo
    {
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }
        public long FileSize { get; set; }
        public string? ContentType { get; set; }
        public DateTime UploadedAt { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
    }

}