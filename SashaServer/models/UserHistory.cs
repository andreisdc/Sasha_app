namespace SashaServer.Models
{
    public class UserHistory
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid PropertyId { get; set; }
        public string PropertyName { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public short? Rating { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
