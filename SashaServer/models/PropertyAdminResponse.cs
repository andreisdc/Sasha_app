// ✅ Response pentru admin cu detalii complete

namespace SashaServer.Models

{
public class PropertyAdminResponse
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string LocationType { get; set; }
    public string? Address { get; set; }
    public required string City { get; set; }
    public string? County { get; set; }
    public required string Country { get; set; }
    public decimal PricePerNight { get; set; }
    public int Bathrooms { get; set; }
    public int MaxGuests { get; set; }
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsVerified { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
}
