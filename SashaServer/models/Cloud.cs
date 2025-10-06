namespace SashaServer.Models
{
    public class CloudConfig
    {
        public string ProjectId { get; set; } = string.Empty;
        public string BucketName { get; set; } = string.Empty;
        public string CredentialsPath { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string AssetsBucket { get; set; } = "sasha-stays-documents"; // ✅ Adaugă această linie

}


    public class FileUploadResult
    {
        public bool Success { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public string? ErrorMessage { get; set; }
        public long FileSize { get; set; }
        public string? ContentType { get; set; }
    }

    public class CloudFileInfo
    {
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }
}