namespace SashaServer.Models
{
    public class Property
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string LocationType { get; set; } = "apartment";
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? County { get; set; }
        public string Country { get; set; } = "Romania";
        public string? PostalCode { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string Status { get; set; } = "available";
        public decimal PricePerNight { get; set; }
        public int MinNights { get; set; } = 1;
        public int MaxNights { get; set; } = 30;
        public TimeSpan CheckInTime { get; set; } = TimeSpan.FromHours(15);
        public TimeSpan CheckOutTime { get; set; } = TimeSpan.FromHours(11);
        public int MaxGuests { get; set; } = 0;
        public int Bathrooms { get; set; } = 0;
        public bool Kitchen { get; set; } = false;
        public decimal LivingSpace { get; set; }
        public bool PetFriendly { get; set; } = false;
        public bool SmokeDetector { get; set; } = false;
        public bool FireExtinguisher { get; set; } = false;
        public bool CarbonMonoxideDetector { get; set; } = false;
        public string? LockType { get; set; }
        public decimal AverageRating { get; set; } = 0;
        public int ReviewCount { get; set; } = 0;
        public string? NeighborhoodDescription { get; set; }
        public string[]? Tags { get; set; }
        public bool InstantBook { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsVerified { get; set; }
    }
}
