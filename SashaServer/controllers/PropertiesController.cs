using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SashaServer.Models;
using SashaServer.Data;
using SashaServer.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PropertiesController : ControllerBase
    {
        private readonly DataMap _dataMap;
        private readonly ILogger<PropertiesController> _logger;
        private readonly IGoogleCloudService _googleCloudService;

        private const string STATUS_AVAILABLE = "available";
        private const string STATUS_UNAVAILABLE = "unavailable";
        private const int MAX_UNVERIFIED_PROPERTIES = 3;
        private const string ASSETS_BUCKET = "sasha-stays-assets"; // Bucket pentru imagini

        public PropertiesController(DataMap dataMap, ILogger<PropertiesController> logger, IGoogleCloudService googleCloudService)
        {
            _dataMap = dataMap;
            _logger = logger;
            _googleCloudService = googleCloudService;
        }

        // ================================
        // 🏠 CREATE PROPERTY
        // ================================
        [HttpPost]
        public ActionResult<ApiResponse<PropertyResponse>> CreateProperty([FromBody] CreatePropertyRequest request)
        {
            try
            {
                _logger.LogInformation("🏠 Creating property for user: {UserId}", request.OwnerId);

                if (request == null)
                {
                    return BadRequest(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Property data is required",
                        Data = null
                    });
                }

                // ✅ VERIFICARE: Maxim 3 proprietăți neverificate per user
                var userProperties = _dataMap.GetProperties().Where(p => p.OwnerId == request.OwnerId).ToList();
                var unverifiedCount = userProperties.Count(p => !p.IsVerified);

                if (unverifiedCount >= MAX_UNVERIFIED_PROPERTIES)
                {
                    return BadRequest(new ApiResponse<string>
                    {
                        Success = false,
                        Message = $"You can have maximum {MAX_UNVERIFIED_PROPERTIES} unverified properties.",
                        Data = null
                    });
                }

                // Creează proprietatea
                var property = new Property
                {
                    Id = Guid.NewGuid(),
                    OwnerId = request.OwnerId,
                    Title = request.Title.Trim(),
                    Description = request.Description.Trim(),
                    LocationType = request.LocationType,
                    Address = request.Address?.Trim(),
                    City = request.City?.Trim(),
                    County = request.County?.Trim(),
                    Country = request.Country?.Trim() ?? "Romania",
                    PostalCode = request.PostalCode?.Trim(),
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    Status = STATUS_AVAILABLE,
                    PricePerNight = request.PricePerNight,
                    MinNights = Math.Max(1, request.MinNights),
                    MaxNights = Math.Min(365, request.MaxNights),
                    CheckInTime = request.CheckInTime,
                    CheckOutTime = request.CheckOutTime,
                    MaxGuests = Math.Max(1, request.MaxGuests),
                    Bathrooms = Math.Max(0, request.Bathrooms),
                    Kitchen = request.Kitchen,
                    LivingSpace = Math.Max(0, request.LivingSpace),
                    PetFriendly = request.PetFriendly,
                    SmokeDetector = request.SmokeDetector,
                    FireExtinguisher = request.FireExtinguisher,
                    CarbonMonoxideDetector = request.CarbonMonoxideDetector,
                    LockType = request.LockType?.Trim(),
                    AverageRating = 0,
                    ReviewCount = 0,
                    NeighborhoodDescription = request.NeighborhoodDescription?.Trim(),
                    Tags = request.Tags ?? Array.Empty<string>(),
                    InstantBook = request.InstantBook,
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,

                    // === OUTDOOR ACTIVITIES ===
                    Hiking = request.Hiking,
                    Biking = request.Biking,
                    Swimming = request.Swimming,
                    Fishing = request.Fishing,
                    Skiing = request.Skiing,
                    Snowboarding = request.Snowboarding,
                    HorseRiding = request.HorseRiding,
                    Climbing = request.Climbing,
                    Camping = request.Camping,
                    Beach = request.Beach,

                    // === CULTURAL ACTIVITIES ===
                    Museum = request.Museum,
                    HistoricalSite = request.HistoricalSite,
                    ArtGallery = request.ArtGallery,
                    Theatre = request.Theatre,
                    LocalMarket = request.LocalMarket,
                    WineryTour = request.WineryTour,

                    // === FOOD & DRINK ===
                    Restaurant = request.Restaurant,
                    Bar = request.Bar,
                    Cafe = request.Cafe,
                    LocalFood = request.LocalFood,
                    WineTasting = request.WineTasting,

                    // === ADVENTURE ACTIVITIES ===
                    Kayaking = request.Kayaking,
                    Rafting = request.Rafting,
                    Paragliding = request.Paragliding,
                    Zipline = request.Zipline,

                    // === RELAXATION ===
                    Spa = request.Spa,
                    Yoga = request.Yoga,
                    Meditation = request.Meditation,
                    HotSprings = request.HotSprings,

                    // === FAMILY ACTIVITIES ===
                    Playground = request.Playground,
                    Zoo = request.Zoo,
                    Aquarium = request.Aquarium,
                    AmusementPark = request.AmusementPark,

                    // === PROPERTY AMENITIES ===
                    Wifi = request.Wifi,
                    AirConditioning = request.AirConditioning,
                    Heating = request.Heating,
                    Pool = request.Pool,
                    Parking = request.Parking,
                    Fireplace = request.Fireplace,
                    Balcony = request.Balcony,
                    Garden = request.Garden,
                    Tv = request.Tv,
                    HotTub = request.HotTub,
                    WheelchairAccessible = request.WheelchairAccessible,
                    Bbq = request.Bbq,
                    BreakfastIncluded = request.BreakfastIncluded,
                    Washer = request.Washer,
                    Dryer = request.Dryer
                };

                _dataMap.AddProperty(property);

                _logger.LogInformation("✅ Property created: {PropertyId} (Unverified: {Count}/{Max})",
                    property.Id, unverifiedCount + 1, MAX_UNVERIFIED_PROPERTIES);

                return Ok(new ApiResponse<PropertyResponse>
                {
                    Success = true,
                    Message = "Property created successfully",
                    Data = MapToPropertyResponse(property)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating property");
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 📋 GET ALL PROPERTIES (LIGHTWEIGHT - pentru liste)
        // ================================
        [HttpGet]
        public ActionResult<ApiResponse<List<PropertySummaryResponse>>> GetAllProperties()
        {
            try
            {
                _logger.LogInformation("📋 Getting all properties (lightweight)");

                // Folosim metoda optimizată care include cover photos
                var propertiesWithCovers = _dataMap.GetPropertiesWithCoverPhotos();
                
                var propertyResponses = propertiesWithCovers.Select(property => 
                {
                    return new PropertySummaryResponse
                    {
                        Id = property.Id,
                        OwnerId = property.OwnerId,
                        Title = property.Title,
                        City = property.City,
                        Country = property.Country,
                        PricePerNight = property.PricePerNight,
                        Bathrooms = property.Bathrooms,
                        MaxGuests = property.MaxGuests,
                        AverageRating = property.AverageRating,
                        ReviewCount = property.ReviewCount,
                        IsVerified = property.IsVerified,
                        Status = property.Status,
                        CoverImageUrl = property.CoverImageUrl,
                        CreatedAt = property.CreatedAt
                    };
                }).ToList();

                _logger.LogInformation("✅ Retrieved {Count} properties", propertyResponses.Count);

                return Ok(new ApiResponse<List<PropertySummaryResponse>>
                {
                    Success = true,
                    Message = $"Retrieved {propertyResponses.Count} properties",
                    Data = propertyResponses
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting all properties");
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 🔍 GET PROPERTY BY ID (FULL DETAILS)
        // ================================
        [HttpGet("{id}")]
        public ActionResult<ApiResponse<PropertyDetailsResponse>> GetPropertyById(Guid id)
        {
            try
            {
                _logger.LogInformation("🔍 Getting full property details: {PropertyId}", id);

                var property = _dataMap.GetPropertyById(id);
                if (property == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Property not found",
                        Data = null
                    });
                }

                // Folosim metoda optimizată pentru a obține toate pozele
                var propertyPhotos = _dataMap.GetPropertyPhotosWithDetails(id);

                var response = new PropertyDetailsResponse
                {
                    Id = property.Id,
                    OwnerId = property.OwnerId,
                    Title = property.Title,
                    Description = property.Description,
                    LocationType = property.LocationType,
                    Address = property.Address,
                    City = property.City,
                    County = property.County,
                    Country = property.Country,
                    PostalCode = property.PostalCode,
                    Status = property.Status,
                    PricePerNight = property.PricePerNight,
                    MinNights = property.MinNights,
                    MaxNights = property.MaxNights,
                    CheckInTime = property.CheckInTime,
                    CheckOutTime = property.CheckOutTime,
                    MaxGuests = property.MaxGuests,
                    Bathrooms = property.Bathrooms,
                    Kitchen = property.Kitchen,
                    LivingSpace = property.LivingSpace,
                    PetFriendly = property.PetFriendly,
                    SmokeDetector = property.SmokeDetector,
                    FireExtinguisher = property.FireExtinguisher,
                    CarbonMonoxideDetector = property.CarbonMonoxideDetector,
                    LockType = property.LockType,
                    AverageRating = property.AverageRating,
                    ReviewCount = property.ReviewCount,
                    NeighborhoodDescription = property.NeighborhoodDescription,
                    Tags = property.Tags,
                    InstantBook = property.InstantBook,
                    IsVerified = property.IsVerified,
                    CreatedAt = property.CreatedAt,
                    UpdatedAt = property.UpdatedAt,
                    Images = propertyPhotos.Select(pp => new PropertyImage
                    {
                        Id = pp.Id,
                        Url = pp.FilePath,
                        IsCover = pp.IsCover,
                        CreatedAt = pp.CreatedAt
                    }).ToList(),

                    // === OUTDOOR ACTIVITIES ===
                    Hiking = property.Hiking,
                    Biking = property.Biking,
                    Swimming = property.Swimming,
                    Fishing = property.Fishing,
                    Skiing = property.Skiing,
                    Snowboarding = property.Snowboarding,
                    HorseRiding = property.HorseRiding,
                    Climbing = property.Climbing,
                    Camping = property.Camping,
                    Beach = property.Beach,

                    // === CULTURAL ACTIVITIES ===
                    Museum = property.Museum,
                    HistoricalSite = property.HistoricalSite,
                    ArtGallery = property.ArtGallery,
                    Theatre = property.Theatre,
                    LocalMarket = property.LocalMarket,
                    WineryTour = property.WineryTour,

                    // === FOOD & DRINK ===
                    Restaurant = property.Restaurant,
                    Bar = property.Bar,
                    Cafe = property.Cafe,
                    LocalFood = property.LocalFood,
                    WineTasting = property.WineTasting,

                    // === ADVENTURE ACTIVITIES ===
                    Kayaking = property.Kayaking,
                    Rafting = property.Rafting,
                    Paragliding = property.Paragliding,
                    Zipline = property.Zipline,

                    // === RELAXATION ===
                    Spa = property.Spa,
                    Yoga = property.Yoga,
                    Meditation = property.Meditation,
                    HotSprings = property.HotSprings,

                    // === FAMILY ACTIVITIES ===
                    Playground = property.Playground,
                    Zoo = property.Zoo,
                    Aquarium = property.Aquarium,
                    AmusementPark = property.AmusementPark,

                    // === PROPERTY AMENITIES ===
                    Wifi = property.Wifi,
                    AirConditioning = property.AirConditioning,
                    Heating = property.Heating,
                    Pool = property.Pool,
                    Parking = property.Parking,
                    Fireplace = property.Fireplace,
                    Balcony = property.Balcony,
                    Garden = property.Garden,
                    Tv = property.Tv,
                    HotTub = property.HotTub,
                    WheelchairAccessible = property.WheelchairAccessible,
                    Bbq = property.Bbq,
                    BreakfastIncluded = property.BreakfastIncluded,
                    Washer = property.Washer,
                    Dryer = property.Dryer
                };

                return Ok(new ApiResponse<PropertyDetailsResponse>
                {
                    Success = true,
                    Message = "Property retrieved successfully",
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting property: {PropertyId}", id);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 👤 GET USER PROPERTIES (LIGHTWEIGHT)
        // ================================
        [HttpGet("user/{userId}")]
        public ActionResult<ApiResponse<List<PropertySummaryResponse>>> GetUserProperties(Guid userId)
        {
            try
            {
                _logger.LogInformation("👤 Getting properties for user: {UserId}", userId);

                // Folosim metoda optimizată pentru proprietățile utilizatorului
                var userProperties = _dataMap.GetUserPropertiesWithCoverPhotos(userId);

                var propertyResponses = userProperties.Select(property => 
                {
                    return new PropertySummaryResponse
                    {
                        Id = property.Id,
                        OwnerId = property.OwnerId,
                        Title = property.Title,
                        City = property.City,
                        Country = property.Country,
                        PricePerNight = property.PricePerNight,
                        Bathrooms = property.Bathrooms,
                        MaxGuests = property.MaxGuests,
                        AverageRating = property.AverageRating,
                        ReviewCount = property.ReviewCount,
                        IsVerified = property.IsVerified,
                        Status = property.Status,
                        CoverImageUrl = property.CoverImageUrl,
                        CreatedAt = property.CreatedAt
                    };
                }).ToList();

                _logger.LogInformation("✅ Retrieved {Count} properties for user {UserId}", propertyResponses.Count, userId);

                return Ok(new ApiResponse<List<PropertySummaryResponse>>
                {
                    Success = true,
                    Message = $"Retrieved {propertyResponses.Count} properties",
                    Data = propertyResponses
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting user properties: {UserId}", userId);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 👤 GET USER VERIFIED PROPERTIES
        // ================================
        [HttpGet("user/{userId}/verified")]
        public ActionResult<ApiResponse<List<PropertySummaryResponse>>> GetUserVerifiedProperties(Guid userId)
        {
            try
            {
                _logger.LogInformation("👤 Getting verified properties for user: {UserId}", userId);

                var userProperties = _dataMap.GetUserPropertiesWithCoverPhotos(userId);
                var verifiedProperties = userProperties.Where(p => p.IsVerified).ToList();

                var propertyResponses = verifiedProperties.Select(property => 
                {
                    return new PropertySummaryResponse
                    {
                        Id = property.Id,
                        OwnerId = property.OwnerId,
                        Title = property.Title,
                        City = property.City,
                        Country = property.Country,
                        PricePerNight = property.PricePerNight,
                        Bathrooms = property.Bathrooms,
                        MaxGuests = property.MaxGuests,
                        AverageRating = property.AverageRating,
                        ReviewCount = property.ReviewCount,
                        IsVerified = property.IsVerified,
                        Status = property.Status,
                        CoverImageUrl = property.CoverImageUrl,
                        CreatedAt = property.CreatedAt
                    };
                }).ToList();

                _logger.LogInformation("✅ Retrieved {Count} verified properties for user {UserId}", propertyResponses.Count, userId);

                return Ok(new ApiResponse<List<PropertySummaryResponse>>
                {
                    Success = true,
                    Message = $"Retrieved {propertyResponses.Count} verified properties",
                    Data = propertyResponses
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting user verified properties: {UserId}", userId);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 👤 GET USER UNVERIFIED PROPERTIES
        // ================================
        [HttpGet("user/{userId}/unverified")]
        public ActionResult<ApiResponse<List<PropertySummaryResponse>>> GetUserUnverifiedProperties(Guid userId)
        {
            try
            {
                _logger.LogInformation("👤 Getting unverified properties for user: {UserId}", userId);

                var userProperties = _dataMap.GetUserPropertiesWithCoverPhotos(userId);
                var unverifiedProperties = userProperties.Where(p => !p.IsVerified).ToList();

                var propertyResponses = unverifiedProperties.Select(property => 
                {
                    return new PropertySummaryResponse
                    {
                        Id = property.Id,
                        OwnerId = property.OwnerId,
                        Title = property.Title,
                        City = property.City,
                        Country = property.Country,
                        PricePerNight = property.PricePerNight,
                        Bathrooms = property.Bathrooms,
                        MaxGuests = property.MaxGuests,
                        AverageRating = property.AverageRating,
                        ReviewCount = property.ReviewCount,
                        IsVerified = property.IsVerified,
                        Status = property.Status,
                        CoverImageUrl = property.CoverImageUrl,
                        CreatedAt = property.CreatedAt
                    };
                }).ToList();

                _logger.LogInformation("✅ Retrieved {Count} unverified properties for user {UserId}", propertyResponses.Count, userId);

                return Ok(new ApiResponse<List<PropertySummaryResponse>>
                {
                    Success = true,
                    Message = $"Retrieved {propertyResponses.Count} unverified properties",
                    Data = propertyResponses
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting user unverified properties: {UserId}", userId);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 🖼️ UPLOAD PHOTOS
        // ================================
        [HttpPost("{propertyId}/photos")]
        public async Task<ActionResult<ApiResponse<List<string>>>> UploadPhotos(Guid propertyId, [FromForm] List<IFormFile> photos)
        {
            try
            {
                if (photos == null || photos.Count == 0)
                {
                    return BadRequest(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "No photos provided",
                        Data = null
                    });
                }

                var property = _dataMap.GetPropertyById(propertyId);
                if (property == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Property not found",
                        Data = null
                    });
                }

                var uploadedUrls = new List<string>();
                
                // Folosim metoda optimizată pentru a verifica dacă proprietatea are deja poze
                var hasExistingPhotos = _dataMap.PropertyHasPhotos(propertyId);
                var isFirstPhoto = !hasExistingPhotos;

                foreach (var photo in photos)
                {
                    if (photo.Length == 0) continue;

                    using var memoryStream = new MemoryStream();
                    await photo.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    var fileName = $"{propertyId}/{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";

                    // ✅ CORECTAT: Adăugat parametrul bucketName
                    var uploadResult = await _googleCloudService.UploadFileAsync(
                        memoryStream,
                        fileName,
                        photo.ContentType,
                        ASSETS_BUCKET);

                    if (uploadResult.Success)
                    {
                        uploadedUrls.Add(uploadResult.FileUrl);

                        var propertyPhoto = new PropertyPhoto
                        {
                            Id = Guid.NewGuid(),
                            PropertyId = propertyId,
                            FilePath = uploadResult.FileUrl,
                            IsCover = isFirstPhoto, // Prima poză devine cover
                            CreatedAt = DateTime.UtcNow
                        };

                        _dataMap.AddPropertyPhoto(propertyPhoto);
                        isFirstPhoto = false;
                    }
                }

                return Ok(new ApiResponse<List<string>>
                {
                    Success = true,
                    Message = $"Uploaded {uploadedUrls.Count} photos",
                    Data = uploadedUrls
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error uploading photos");
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 🔄 VERIFY PROPERTY
        // ================================
        [HttpPatch("{id}/verify")]
        public ActionResult<ApiResponse<PropertyResponse>> VerifyProperty(Guid id)
        {
            try
            {
                var property = _dataMap.GetPropertyById(id);
                if (property == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Property not found",
                        Data = null
                    });
                }

                property.IsVerified = true;
                property.UpdatedAt = DateTime.UtcNow;

                var updated = _dataMap.UpdateProperty(property);
                if (!updated)
                {
                    return StatusCode(500, new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Failed to verify property",
                        Data = null
                    });
                }

                return Ok(new ApiResponse<PropertyResponse>
                {
                    Success = true,
                    Message = "Property verified successfully",
                    Data = MapToPropertyResponse(property)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verifying property: {PropertyId}", id);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 🗑️ DELETE PROPERTY
        // ================================
        [HttpDelete("{id}")]
        public ActionResult<ApiResponse<string>> DeleteProperty(Guid id)
        {
            try
            {
                var property = _dataMap.GetPropertyById(id);
                if (property == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Property not found",
                        Data = null
                    });
                }

                // Ștergem mai întâi toate pozele asociate
                _dataMap.DeleteAllPropertyPhotos(id);

                // Apoi ștergem proprietatea
                var deleted = _dataMap.DeletePropertyById(id);
                if (!deleted)
                {
                    return StatusCode(500, new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Failed to delete property",
                        Data = null
                    });
                }

                return Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Property deleted successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error deleting property: {PropertyId}", id);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 📸 SET COVER PHOTO
        // ================================
        [HttpPatch("{propertyId}/photos/{photoId}/cover")]
        public ActionResult<ApiResponse<string>> SetCoverPhoto(Guid propertyId, Guid photoId)
        {
            try
            {
                var property = _dataMap.GetPropertyById(propertyId);
                if (property == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Property not found",
                        Data = null
                    });
                }

                var photo = _dataMap.GetPropertyPhotoById(photoId);
                if (photo == null || photo.PropertyId != propertyId)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Photo not found",
                        Data = null
                    });
                }

                var updated = _dataMap.UpdatePropertyCoverPhoto(propertyId, photoId);
                if (!updated)
                {
                    return StatusCode(500, new ApiResponse<string>
                    {
                        Success = false,
                        Message = "Failed to set cover photo",
                        Data = null
                    });
                }

                return Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Cover photo updated successfully",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error setting cover photo: PropertyId={PropertyId}, PhotoId={PhotoId}", propertyId, photoId);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // PRIVATE METHODS
        // ================================

        private PropertyResponse MapToPropertyResponse(Property property)
        {
            return new PropertyResponse
            {
                Id = property.Id,
                OwnerId = property.OwnerId,
                Title = property.Title,
                Description = property.Description,
                LocationType = property.LocationType,
                Address = property.Address,
                City = property.City,
                County = property.County,
                Country = property.Country,
                PostalCode = property.PostalCode,
                Status = property.Status,
                PricePerNight = property.PricePerNight,
                MinNights = property.MinNights,
                MaxNights = property.MaxNights,
                CheckInTime = property.CheckInTime,
                CheckOutTime = property.CheckOutTime,
                MaxGuests = property.MaxGuests,
                Bathrooms = property.Bathrooms,
                Kitchen = property.Kitchen,
                LivingSpace = property.LivingSpace,
                PetFriendly = property.PetFriendly,
                SmokeDetector = property.SmokeDetector,
                FireExtinguisher = property.FireExtinguisher,
                CarbonMonoxideDetector = property.CarbonMonoxideDetector,
                LockType = property.LockType,
                AverageRating = property.AverageRating,
                ReviewCount = property.ReviewCount,
                NeighborhoodDescription = property.NeighborhoodDescription,
                Tags = property.Tags,
                InstantBook = property.InstantBook,
                IsVerified = property.IsVerified,
                CreatedAt = property.CreatedAt,
                UpdatedAt = property.UpdatedAt,

                // === OUTDOOR ACTIVITIES ===
                Hiking = property.Hiking,
                Biking = property.Biking,
                Swimming = property.Swimming,
                Fishing = property.Fishing,
                Skiing = property.Skiing,
                Snowboarding = property.Snowboarding,
                HorseRiding = property.HorseRiding,
                Climbing = property.Climbing,
                Camping = property.Camping,
                Beach = property.Beach,

                // === CULTURAL ACTIVITIES ===
                Museum = property.Museum,
                HistoricalSite = property.HistoricalSite,
                ArtGallery = property.ArtGallery,
                Theatre = property.Theatre,
                LocalMarket = property.LocalMarket,
                WineryTour = property.WineryTour,

                // === FOOD & DRINK ===
                Restaurant = property.Restaurant,
                Bar = property.Bar,
                Cafe = property.Cafe,
                LocalFood = property.LocalFood,
                WineTasting = property.WineTasting,

                // === ADVENTURE ACTIVITIES ===
                Kayaking = property.Kayaking,
                Rafting = property.Rafting,
                Paragliding = property.Paragliding,
                Zipline = property.Zipline,

                // === RELAXATION ===
                Spa = property.Spa,
                Yoga = property.Yoga,
                Meditation = property.Meditation,
                HotSprings = property.HotSprings,

                // === FAMILY ACTIVITIES ===
                Playground = property.Playground,
                Zoo = property.Zoo,
                Aquarium = property.Aquarium,
                AmusementPark = property.AmusementPark,

                // === PROPERTY AMENITIES ===
                Wifi = property.Wifi,
                AirConditioning = property.AirConditioning,
                Heating = property.Heating,
                Pool = property.Pool,
                Parking = property.Parking,
                Fireplace = property.Fireplace,
                Balcony = property.Balcony,
                Garden = property.Garden,
                Tv = property.Tv,
                HotTub = property.HotTub,
                WheelchairAccessible = property.WheelchairAccessible,
                Bbq = property.Bbq,
                BreakfastIncluded = property.BreakfastIncluded,
                Washer = property.Washer,
                Dryer = property.Dryer
            };
        }
    }

    // ================================
    // MODELE OPTIMIZATE
    // ================================

    public class CreatePropertyRequest
    {
        public Guid OwnerId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string LocationType { get; set; }
        public string? Address { get; set; }
        public required string City { get; set; }
        public string? County { get; set; }
        public string Country { get; set; } = "Romania";
        public string? PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
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
        public string? NeighborhoodDescription { get; set; }
        public string[] Tags { get; set; } = Array.Empty<string>();
        public bool InstantBook { get; set; } = false;

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
    }

    // ✅ Response lightweight pentru liste
    public class PropertySummaryResponse
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public required string Title { get; set; }
        public required string City { get; set; }
        public required string Country { get; set; }
        public decimal PricePerNight { get; set; }
        public int Bathrooms { get; set; }
        public int MaxGuests { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsVerified { get; set; }
        public required string Status { get; set; }
        public string? CoverImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ✅ Response complet pentru detalii
    public class PropertyDetailsResponse
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string LocationType { get; set; }
        public string? Address { get; set; }
        public required string City { get; set; }
        public string? County { get; set; }
        public required string Country { get; set; }
        public string? PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public required string Status { get; set; }
        public decimal PricePerNight { get; set; }
        public int MinNights { get; set; }
        public int MaxNights { get; set; }
        public TimeSpan CheckInTime { get; set; }
        public TimeSpan CheckOutTime { get; set; }
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
        public string[] Tags { get; set; } = Array.Empty<string>();
        public bool InstantBook { get; set; }
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<PropertyImage> Images { get; set; } = new List<PropertyImage>();

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
    }

    public class PropertyImage
    {
        public Guid Id { get; set; }
        public required string Url { get; set; }
        public bool IsCover { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ⚠️ Păstrăm și vechiul model pentru compatibilitate
    public class PropertyResponse
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string LocationType { get; set; }
        public string? Address { get; set; }
        public required string City { get; set; }
        public string? County { get; set; }
        public required string Country { get; set; }
        public string? PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public required string Status { get; set; }
        public decimal PricePerNight { get; set; }
        public int MinNights { get; set; }
        public int MaxNights { get; set; }
        public TimeSpan CheckInTime { get; set; }
        public TimeSpan CheckOutTime { get; set; }
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
        public string[] Tags { get; set; } = Array.Empty<string>();
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
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }
}