namespace SashaServer.Models
{
   public class Property
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string City { get; set; } = string.Empty;
    public string? County { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int MinNights { get; set; } = 1;
    public int MaxNights { get; set; } = 30;
    public TimeSpan CheckInTime { get; set; } = new TimeSpan(15, 0, 0);
    public TimeSpan CheckOutTime { get; set; } = new TimeSpan(11, 0, 0);
    public int MaxGuests { get; set; }
    public int Bathrooms { get; set; }
    public bool Kitchen { get; set; }
    public decimal LivingSpace { get; set; }
    public bool PetFriendly { get; set; }
    public bool SmokeDetector { get; set; }
    public bool FireExtinguisher { get; set; }
    public bool CarbonMonoxideDetector { get; set; }
    public string? LockType { get; set; }
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public string? NeighborhoodDescription { get; set; }
    public bool InstantBook { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // === OUTDOOR ACTIVITIES ===
    public bool Hiking { get; set; }
    public bool Biking { get; set; }
    public bool Swimming { get; set; }
    public bool Fishing { get; set; }
    public bool Skiing { get; set; }
    public bool Snowboarding { get; set; }
    public bool HorseRiding { get; set; }
    public bool Climbing { get; set; }
    public bool Camping { get; set; }
    public bool Beach { get; set; }

    // === CULTURAL ACTIVITIES ===
    public bool Museum { get; set; }
    public bool HistoricalSite { get; set; }
    public bool ArtGallery { get; set; }
    public bool Theatre { get; set; }
    public bool LocalMarket { get; set; }
    public bool WineryTour { get; set; }

    // === FOOD & DRINK ===
    public bool Restaurant { get; set; }
    public bool Bar { get; set; }
    public bool Cafe { get; set; }
    public bool LocalFood { get; set; }
    public bool WineTasting { get; set; }

    // === ADVENTURE ACTIVITIES ===
    public bool Kayaking { get; set; }
    public bool Rafting { get; set; }
    public bool Paragliding { get; set; }
    public bool Zipline { get; set; }

    // === RELAXATION ===
    public bool Spa { get; set; }
    public bool Yoga { get; set; }
    public bool Meditation { get; set; }
    public bool HotSprings { get; set; }

    // === FAMILY ACTIVITIES ===
    public bool Playground { get; set; }
    public bool Zoo { get; set; }
    public bool Aquarium { get; set; }
    public bool AmusementPark { get; set; }

    // === PROPERTY AMENITIES ===
    public bool Wifi { get; set; }
    public bool AirConditioning { get; set; }
    public bool Heating { get; set; }
    public bool Pool { get; set; }
    public bool Parking { get; set; }
    public bool Fireplace { get; set; }
    public bool Balcony { get; set; }
    public bool Garden { get; set; }
    public bool Tv { get; set; }
    public bool HotTub { get; set; }
    public bool WheelchairAccessible { get; set; }
    public bool Bbq { get; set; }
    public bool BreakfastIncluded { get; set; }
    public bool Washer { get; set; }
    public bool Dryer { get; set; }
    public string[] Tags { get; internal set; }
    }
}
