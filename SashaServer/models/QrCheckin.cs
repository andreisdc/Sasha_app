
namespace SashaServer.Models
{
    public class QrCheckin
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string QrCode { get; set; } = string.Empty;
        public bool CheckedIn { get; set; } = false;
        public bool CheckedOut { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
