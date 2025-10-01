using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using SashaServer.Services;
using SashaServer.Helpers;


namespace SashaServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PendingApproveController : ControllerBase
    {
        private readonly DataMap _data;
        private readonly ILogger<PendingApproveController> _logger;
        private readonly IGoogleCloudService _googleCloudService;
        private readonly CnpHelper _cnpHelper;

        public PendingApproveController(
            DataMap data,
            ILogger<PendingApproveController> logger,
            IGoogleCloudService googleCloudService,
            CnpHelper cnpHelper)
        {
            _data = data;
            _logger = logger;
            _googleCloudService = googleCloudService;
            _cnpHelper = cnpHelper;
        }

        // --- GET: api/pendingapprove
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var all = _data.GetAllPendingApprove()
                    .Select(p => new
                    {
                        p.FirstName,
                        p.LastName,
                        p.Status,
                        p.FailReason,
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt
                    })
                    .ToList();

                return Ok(all);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all approvals");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

 // --- GET: api/pendingapprove/{id}/photo
[HttpGet("{id}/photo")]
public async Task<IActionResult> GetPhoto(Guid id)
{
    try
    {
        var pendingApprove = _data.GetPendingApproveById(id);
        if (pendingApprove == null)
            return NotFound(new { message = "Pending approval not found" });

        Console.WriteLine($"🔍 PendingApprove Photo URL: {pendingApprove.Photo}");

        // ✅ Verifică dacă poza a fost deja redactată
        if (string.IsNullOrEmpty(pendingApprove.Photo) || 
            pendingApprove.Photo == "[REDACTED]" || 
            pendingApprove.Photo == " ")
        {
            return NotFound(new { message = "Photo has been deleted after verification" });
        }

        // ❌ PROBLEMĂ: Path.GetFileName extrage doar numele fișierului
        // dar în GCS fișierul are path complet: "uploads/2024/01/15/verification_abc123.png"
        var fileNameOnly = Path.GetFileName(pendingApprove.Photo);
        Console.WriteLine($"🔍 Extracted file name only: {fileNameOnly}");
        
        // ✅ CORECT: Folosește întregul path din URL-ul GCS
        // Exemplu: https://storage.googleapis.com/your-bucket/uploads/2024/01/15/verification_abc123.png
        // Trebuie să extragem: "uploads/2024/01/15/verification_abc123.png"
        var filePath = ExtractGcsFilePath(pendingApprove.Photo);
        Console.WriteLine($"🔍 Extracted GCS file path: {filePath}");

        // ✅ Verifică dacă fișierul există în cloud
        var fileExists = await _googleCloudService.FileExistsAsync(filePath);
        Console.WriteLine($"🔍 File exists in GCS: {fileExists}");
        
        if (!fileExists)
        {
            return NotFound(new { message = $"Photo file not found in storage. Path: {filePath}" });
        }

        // Descarcă poza ca stream
        var fileStream = await _googleCloudService.DownloadFileAsync(filePath);
        
        if (fileStream == null)
            return NotFound(new { message = "Error downloading photo from storage" });

        // Determină content type-ul corect
        string contentType = "image/jpeg";
        if (filePath.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
            contentType = "image/png";
        else if (filePath.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || 
                 filePath.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))
            contentType = "image/jpeg";

        // ✅ Adaugă headers pentru cache și security
        Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        Response.Headers.Append("Pragma", "no-cache");
        Response.Headers.Append("Expires", "0");

        return File(fileStream, contentType);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting photo for {Id}", id);
        return StatusCode(500, new { message = "Internal server error" });
    }
}

// ✅ Metodă helper corectată pentru a extrage doar path-ul relativ din bucket
private string ExtractGcsFilePath(string photoUrl)
{
    if (string.IsNullOrEmpty(photoUrl))
        return null;

    var uri = new Uri(photoUrl);
    
    // ❌ Greșit: uri.AbsolutePath.TrimStart('/') -> "sasha-stays-documents/uploads/2025.10.01/verification_abc123.png"
    // ✅ Corect: Trebuie să eliminăm și numele bucket-ului
    
    var absolutePath = uri.AbsolutePath.TrimStart('/');
    Console.WriteLine($"🔍 AbsolutePath: {absolutePath}");
    
    // Îndepărtă numele bucket-ului din path
    // "sasha-stays-documents/uploads/2025.10.01/verification_abc123.png" 
    // -> "uploads/2025.10.01/verification_abc123.png"
    var bucketName = "sasha-stays-documents";
    if (absolutePath.StartsWith(bucketName + "/"))
    {
        return absolutePath.Substring(bucketName.Length + 1); // +1 pentru slash
    }
    
    return absolutePath;
}
        // --- GET: api/pendingapprove/pending
        [HttpGet("pending")]
        public IActionResult GetPendingRequests()
        {
            try
            {
                // Funcție helper pentru decriptare sigură
                string TryDecrypt(string encryptedCnp)
                {
                    if (string.IsNullOrEmpty(encryptedCnp)) return null;
                    try
                    {
                        return _cnpHelper.MaskCnp(_cnpHelper.DecryptCnp(encryptedCnp));
                    }
                    catch
                    {
                        _logger.LogWarning("Invalid CNP encountered, skipping decryption");
                        return null;
                    }
                }

                var pendingRequests = _data.GetAllPendingApprove()
                    .Where(p => p.Status == "pending")
                    .Select(p => new
                    {
                        p.Id,
                        p.FirstName,
                        p.LastName,
                        Cnp = TryDecrypt(p.Cnp),
                        p.Photo,
                        p.Address,
                        p.Status,
                        CreatedAt = p.CreatedAt
                    })
                    .ToList();

                return Ok(pendingRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending requests");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- GET: api/pendingapprove/history
        [HttpGet("history")]
        public IActionResult GetApprovalHistory()
        {
            try
            {
                var history = _data.GetAllPendingApprove()
                    .Where(p => p.Status != "pending")
                    .Select(p => new
                    {
                        p.Id,
                        p.FirstName,
                        p.LastName,
                        p.Status,
                        p.FailReason,
                        UpdatedAt = p.UpdatedAt ?? p.CreatedAt,
                        p.CreatedAt
                    })
                    .OrderByDescending(p => p.UpdatedAt)
                    .ToList();

                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting approval history");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- POST: api/pendingapprove/create
       // --- POST: api/pendingapprove/create
[HttpPost("create")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> Create(
    [FromForm] string FirstName,
    [FromForm] string LastName,
    [FromForm] string Cnp,
    [FromForm] string Address,
    [FromForm] IFormFile Photo)
{
    try
    {
        if (Photo == null || Photo.Length == 0)
            return BadRequest(new { message = "Photo is required" });

        var pendingApprove = new PendingApprove
        {
            Id = Guid.NewGuid(), // ✅ ADAUGĂ ID
            UserId = Guid.NewGuid(), // ✅ ADAUGĂ USER_ID (sau obțineți-l din auth)
            FirstName = FirstName,
            LastName = LastName,
            Address = Address,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            Cnp = _cnpHelper.EncryptCnp(Cnp)
        };

        using var ms = new MemoryStream();
        await Photo.CopyToAsync(ms);
        ms.Position = 0;

        var fileName = $"verification_{Guid.NewGuid()}.png";
        var uploadResult = await _googleCloudService.UploadFileAsync(ms, fileName, "image/png");

        if (!uploadResult.Success)
            return StatusCode(500, new { message = "Failed to upload photo", error = uploadResult.ErrorMessage });

        pendingApprove.Photo = uploadResult.FileUrl;
        _data.AddPendingApprove(pendingApprove);

        var response = new
        {
            pendingApprove.Id, // ✅ RETURNEAZĂ ȘI ID-ul
            pendingApprove.FirstName,
            pendingApprove.LastName,
            Cnp = _cnpHelper.MaskCnp(Cnp),
            pendingApprove.Address,
            pendingApprove.Photo,
            pendingApprove.Status,
            pendingApprove.CreatedAt
        };

        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating pending approval");
        return StatusCode(500, new { message = "Internal server error" });
    }
}
        // --- PUT: api/pendingapprove/{id}/approve
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(Guid id)
        {
            try
            {
                var pendingApprove = _data.GetAllPendingApprove().FirstOrDefault(p => p.Id == id);
                if (pendingApprove == null)
                    return NotFound(new { message = "Pending approval not found" });

                // ✅ Șterge fișierul foto din Google Cloud dacă există
                if (!string.IsNullOrEmpty(pendingApprove.Photo) && pendingApprove.Photo != "[REDACTED]")
                {
                    var fileName = Path.GetFileName(pendingApprove.Photo);
                    await _googleCloudService.DeleteFileAsync(fileName);
                }

                // ✅ Curăță datele sensibile
                var cleanSuccess = _data.CleanSensitiveData(id);
                
                // ✅ Actualizează statusul
                if (cleanSuccess)
                {
                    pendingApprove.Status = "approved";
                    pendingApprove.FailReason = null;
                    pendingApprove.UpdatedAt = DateTime.UtcNow;
                    _data.UpdatePendingApprove(pendingApprove);
                }

                return Ok(new
                {
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    Status = "approved",
                    UpdatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving pending request: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- PUT: api/pendingapprove/{id}/reject
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest request)
        {
            try
            {
                var pendingApprove = _data.GetAllPendingApprove().FirstOrDefault(p => p.Id == id);
                if (pendingApprove == null)
                    return NotFound(new { message = "Pending approval not found" });

                // ✅ Șterge fișierul foto din Google Cloud dacă există
                if (!string.IsNullOrEmpty(pendingApprove.Photo) && pendingApprove.Photo != "[REDACTED]")
                {
                    var fileName = Path.GetFileName(pendingApprove.Photo);
                    await _googleCloudService.DeleteFileAsync(fileName);
                }

                // ✅ Curăță datele sensibile
                var cleanSuccess = _data.CleanSensitiveData(id);
                
                // ✅ Actualizează statusul și motivul
                if (cleanSuccess)
                {
                    pendingApprove.Status = "rejected";
                    pendingApprove.FailReason = request.Reason;
                    pendingApprove.UpdatedAt = DateTime.UtcNow;
                    _data.UpdatePendingApprove(pendingApprove);
                }

                return Ok(new
                {
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    Status = "rejected",
                    FailReason = request.Reason,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting pending request: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- DELETE: api/pendingapprove/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                var result = _data.DeletePendingApprove(id);
                if (!result)
                    return BadRequest(new { message = "Cannot delete this request. You can only delete requests older than 1 month." });

                return Ok(new { message = "Deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting pending approval {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }

    public class RejectRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}