namespace SashaServer.Models
{
    public class PropertyActivity
    {
        public Guid Id { get; set; }
        public Guid PropertyId { get; set; }
        public Guid ActivityId { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
