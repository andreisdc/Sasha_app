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

        public PropertiesController(DataMap dataMap, ILogger<PropertiesController> logger, IGoogleCloudService googleCloudService)
        {
            _dataMap = dataMap;
            _logger = logger;
            _googleCloudService = googleCloudService;
        }

        // ================================
        // 🏠 CREATE PROPERTY (SIMPLU)
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
                var allProperties = _dataMap.GetProperties();
                var userProperties = allProperties.Where(p => p.OwnerId == request.OwnerId).ToList();
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
                    IsVerified = false, // ✅ Noua proprietate este neverificată
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
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
        // 📋 GET ALL UNVERIFIED PROPERTIES (SIMPLU)
        // ================================
        [HttpGet("unverified")]
        public ActionResult<ApiResponse<List<PropertyResponse>>> GetUnverifiedProperties()
        {
            try
            {
                _logger.LogInformation("📋 Getting unverified properties");

                // ✅ Simplu: iau toate proprietățile și filtrez cele neverificate
                var allProperties = _dataMap.GetProperties();
                var unverifiedProperties = allProperties.Where(p => !p.IsVerified).ToList();

                var propertyResponses = unverifiedProperties.Select(MapToPropertyResponse).ToList();

                _logger.LogInformation("✅ Retrieved {Count} unverified properties", propertyResponses.Count);

                return Ok(new ApiResponse<List<PropertyResponse>>
                {
                    Success = true,
                    Message = $"Retrieved {propertyResponses.Count} unverified properties",
                    Data = propertyResponses
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting unverified properties");
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 📋 GET ALL VERIFIED PROPERTIES (SIMPLU)
        // ================================
        [HttpGet("verified")]
        public ActionResult<ApiResponse<List<PropertyResponse>>> GetVerifiedProperties()
        {
            try
            {
                _logger.LogInformation("📋 Getting verified properties");

                // ✅ Simplu: iau toate proprietățile și filtrez cele verificate
                var allProperties = _dataMap.GetProperties();
                var verifiedProperties = allProperties.Where(p => p.IsVerified).ToList();

                var propertyResponses = verifiedProperties.Select(MapToPropertyResponse).ToList();

                _logger.LogInformation("✅ Retrieved {Count} verified properties", propertyResponses.Count);

                return Ok(new ApiResponse<List<PropertyResponse>>
                {
                    Success = true,
                    Message = $"Retrieved {propertyResponses.Count} verified properties",
                    Data = propertyResponses
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting verified properties");
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        // ================================
        // 🔍 GET PROPERTY BY ID
        // ================================
        [HttpGet("{id}")]
        public ActionResult<ApiResponse<PropertyResponse>> GetPropertyById(Guid id)
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

                return Ok(new ApiResponse<PropertyResponse>
                {
                    Success = true,
                    Message = "Property retrieved successfully",
                    Data = MapToPropertyResponse(property)
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
        // 📋 GET ALL PROPERTIES
        // ================================
        [HttpGet]
        public ActionResult<ApiResponse<List<PropertyResponse>>> GetAllProperties()
        {
            try
            {
                var properties = _dataMap.GetProperties();
                var propertyResponses = properties.Select(MapToPropertyResponse).ToList();

                return Ok(new ApiResponse<List<PropertyResponse>>
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
        // 🖼️ UPLOAD PHOTOS (SIMPLU)
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

                var uploadedUrls = new List<string>();

                foreach (var photo in photos)
                {
                    if (photo.Length == 0) continue;

                    using var memoryStream = new MemoryStream();
                    await photo.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    // ✅ Organizează în foldere
                    var fileName = $"{propertyId}/{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";

                    var uploadResult = await _googleCloudService.UploadFileAsync(
                        memoryStream,
                        fileName,
                        photo.ContentType);

                    if (uploadResult.Success)
                    {
                        uploadedUrls.Add(uploadResult.FileUrl);

                        // Salvează în baza de date
                        var propertyPhoto = new PropertyPhoto
                        {
                            Id = Guid.NewGuid(),
                            PropertyId = propertyId,
                            FilePath = uploadResult.FileUrl,
                            IsCover = uploadedUrls.Count == 1, // Prima poză = cover
                            CreatedAt = DateTime.UtcNow
                        };

                        _dataMap.AddPropertyPhoto(propertyPhoto);
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
        // 🔄 VERIFY PROPERTY (SIMPLU)
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
                UpdatedAt = property.UpdatedAt
            };
        }
        
        [HttpGet("user/{userId}")]
public ActionResult<ApiResponse<List<PropertyResponse>>> GetUserProperties(Guid userId)
{
    try
    {
        _logger.LogInformation("👤 Getting properties for user: {UserId}", userId);

        var allProperties = _dataMap.GetProperties();
        var userProperties = allProperties.Where(p => p.OwnerId == userId).ToList();

        var propertyResponses = userProperties.Select(MapToPropertyResponse).ToList();

        _logger.LogInformation("✅ Retrieved {Count} properties for user {UserId}", propertyResponses.Count, userId);

        return Ok(new ApiResponse<List<PropertyResponse>>
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
public ActionResult<ApiResponse<List<PropertyResponse>>> GetUserVerifiedProperties(Guid userId)
{
    try
    {
        _logger.LogInformation("👤 Getting verified properties for user: {UserId}", userId);

        var allProperties = _dataMap.GetProperties();
        var verifiedProperties = allProperties.Where(p => p.OwnerId == userId && p.IsVerified).ToList();

        var propertyResponses = verifiedProperties.Select(MapToPropertyResponse).ToList();

        _logger.LogInformation("✅ Retrieved {Count} verified properties for user {UserId}", propertyResponses.Count, userId);

        return Ok(new ApiResponse<List<PropertyResponse>>
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
public ActionResult<ApiResponse<List<PropertyResponse>>> GetUserUnverifiedProperties(Guid userId)
{
    try
    {
        _logger.LogInformation("👤 Getting unverified properties for user: {UserId}", userId);

        var allProperties = _dataMap.GetProperties();
        var unverifiedProperties = allProperties.Where(p => p.OwnerId == userId && !p.IsVerified).ToList();

        var propertyResponses = unverifiedProperties.Select(MapToPropertyResponse).ToList();

        _logger.LogInformation("✅ Retrieved {Count} unverified properties for user {UserId}", propertyResponses.Count, userId);

        return Ok(new ApiResponse<List<PropertyResponse>>
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
    }

    // ================================
    // MODELE (rămân la fel)
    // ================================

    public class CreatePropertyRequest
    {
        public Guid OwnerId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string LocationType { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string County { get; set; }
        public string Country { get; set; } = "Romania";
        public string PostalCode { get; set; }
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
        public string LockType { get; set; }
        public string NeighborhoodDescription { get; set; }
        public string[] Tags { get; set; }
        public bool InstantBook { get; set; } = false;
    }

    public class PropertyResponse
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string LocationType { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string County { get; set; }
        public string Country { get; set; }
        public string PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Status { get; set; }
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
        public string LockType { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string NeighborhoodDescription { get; set; }
        public string[] Tags { get; set; }
        public bool InstantBook { get; set; }
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
    }
}