namespace SashaServer.Models
{
    public class PropertyPhoto
    {
        public Guid Id { get; set; }
        public Guid PropertyId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public bool IsCover { get; set; } = false;
        public DateTime CreatedAt { get; set; }
    }
}
