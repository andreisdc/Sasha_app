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

        // Bucket names
        private const string DOCUMENTS_BUCKET = "sasha-stays-documents"; // Bucket pentru documente private
        private const string ASSETS_BUCKET = "sasha-assets"; // Bucket pentru assets publice

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

                var filePath = ExtractGcsFilePath(pendingApprove.Photo);
                Console.WriteLine($"🔍 Extracted GCS file path: {filePath}");

                // ✅ CORECTAT: Adăugat parametrul bucketName
                var fileExists = await _googleCloudService.FileExistsAsync(filePath, DOCUMENTS_BUCKET);
                Console.WriteLine($"🔍 File exists in GCS: {fileExists}");
                
                if (!fileExists)
                {
                    return NotFound(new { message = $"Photo file not found in storage. Path: {filePath}" });
                }

                // ✅ CORECTAT: Adăugat parametrul bucketName
                var fileStream = await _googleCloudService.DownloadFileAsync(filePath, DOCUMENTS_BUCKET);
                
                if (fileStream == null)
                    return NotFound(new { message = "Error downloading photo from storage" });

                string contentType = "image/jpeg";
                if (filePath.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
                    contentType = "image/png";
                else if (filePath.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || 
                         filePath.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))
                    contentType = "image/jpeg";

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

        private string? ExtractGcsFilePath(string photoUrl)
        {
            if (string.IsNullOrEmpty(photoUrl))
                return null;

            var uri = new Uri(photoUrl);
            var absolutePath = uri.AbsolutePath.TrimStart('/');
            Console.WriteLine($"🔍 AbsolutePath: {absolutePath}");
            
            var bucketName = "sasha-stays-documents";
            if (absolutePath.StartsWith(bucketName + "/"))
            {
                return absolutePath.Substring(bucketName.Length + 1);
            }
            
            return absolutePath;
        }

        // --- GET: api/pendingapprove/pending
        [HttpGet("pending")]
        public IActionResult GetPendingRequests()
        {
            try
            {
                string? TryDecrypt(string? encryptedCnp)
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
        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create(
            [FromForm] string FirstName,
            [FromForm] string LastName,
            [FromForm] string Cnp,
            [FromForm] string Address,
            [FromForm] IFormFile Photo,
            [FromForm] Guid UserId) // ✅ Adaugă UserId ca parametru
        {
            try
            {
                _logger.LogInformation("🔄 Încep procesul de creare cerere verificare pentru UserId: {UserId}", UserId);

                if (Photo == null || Photo.Length == 0)
                    return BadRequest(new { message = "Photo is required" });

                // ✅ VERIFICĂ DACA USER-UL EXISTĂ
                var existingUser = _data.GetUserById(UserId);
                if (existingUser == null)
                {
                    _logger.LogWarning("❌ UserId {UserId} nu există în baza de date", UserId);
                    return BadRequest(new { message = "User not found" });
                }

                _logger.LogInformation("✅ UserId {UserId} există în baza de date", UserId);

                // ✅ VERIFICĂ DACA USER-UL ARE DEJA O CERERE ACTIVĂ
                var existingPendingApprove = _data.GetPendingApproveByUserId(UserId);
                if (existingPendingApprove != null)
                {
                    if (existingPendingApprove.Status == "pending")
                    {
                        _logger.LogWarning("❌ UserId {UserId} are deja o cerere în așteptare (ID: {PendingId})", 
                            UserId, existingPendingApprove.Id);
                        return BadRequest(new { message = "You already have a pending verification request" });
                    }
                    else if (existingPendingApprove.Status == "approved")
                    {
                        _logger.LogWarning("❌ UserId {UserId} este deja verificat (cerere aprobată ID: {PendingId})", 
                            UserId, existingPendingApprove.Id);
                        return BadRequest(new { message = "You are already verified as a seller" });
                    }
                    // Dacă statusul este "rejected", permite crearea unei noi cereri
                    _logger.LogInformation("✅ UserId {UserId} are o cerere respinsă anterior, permite nouă cerere", UserId);
                }

                _logger.LogInformation("✅ UserId {UserId} poate crea o nouă cerere de verificare", UserId);

                var pendingApprove = new PendingApprove
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId, // ✅ Folosește UserId-ul primit
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
                
                // ✅ CORECTAT: Adăugat parametrul bucketName
                var uploadResult = await _googleCloudService.UploadFileAsync(
                    ms, 
                    fileName, 
                    "image/png", 
                    DOCUMENTS_BUCKET);

                if (!uploadResult.Success)
                    return StatusCode(500, new { message = "Failed to upload photo", error = uploadResult.ErrorMessage });

                pendingApprove.Photo = uploadResult.FileUrl;
                _data.AddPendingApprove(pendingApprove);

                _logger.LogInformation("✅ Cerere de verificare creată cu succes pentru UserId: {UserId}, CerereID: {PendingId}", 
                    UserId, pendingApprove.Id);

                var response = new
                {
                    pendingApprove.Id,
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
                _logger.LogError(ex, "❌ Eroare la crearea cererii de aprobare pentru UserId: {UserId}", UserId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- PUT: api/pendingapprove/{id}/approve
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(Guid id)
        {
            try
            {
                _logger.LogInformation("🔄 Încep procesul de aprobare pentru cererea ID: {Id}", id);

                var pendingApprove = _data.GetPendingApproveById(id);
                if (pendingApprove == null)
                {
                    _logger.LogWarning("❌ Cererea de aprobare cu ID: {Id} nu a fost găsită", id);
                    return NotFound(new { message = "Pending approval not found" });
                }

                _logger.LogInformation("✅ Cererea găsită pentru UserId: {UserId}", pendingApprove.UserId);

                // ✅ VERIFICĂ DACA USER-UL EXISTĂ ÎN BAZA DE DATE
                var user = _data.GetUserById(pendingApprove.UserId);
                if (user == null)
                {
                    _logger.LogError("❌ UserId {UserId} din cererea {PendingId} nu există în baza de date", 
                        pendingApprove.UserId, id);
                    return BadRequest(new { message = "User associated with this request does not exist" });
                }

                _logger.LogInformation("✅ User găsit în baza de date: {Username} (ID: {UserId})", 
                    user.Username, user.Id);

                // ✅ Șterge fișierul foto din Google Cloud dacă există
                if (!string.IsNullOrEmpty(pendingApprove.Photo) && pendingApprove.Photo != "[REDACTED]" && pendingApprove.Photo != " ")
                {
                    _logger.LogInformation("🗑️ Șterg fișierul foto pentru cererea ID: {Id}", id);
                    var filePath = ExtractGcsFilePath(pendingApprove.Photo);
                    
                    // ✅ CORECTAT: Adăugat parametrul bucketName
                    await _googleCloudService.DeleteFileAsync(filePath, DOCUMENTS_BUCKET);
                    _logger.LogInformation("✅ Fișierul foto a fost șters cu succes");
                }

                // ✅ Folosește metoda unificată pentru aprobare care face totul într-o singură operațiune
                var success = _data.ApproveAndCleanData(id);

                if (!success)
                {
                    _logger.LogError("❌ Eroare la aprobarea și curățarea datelor pentru cererea ID: {Id}", id);
                    return StatusCode(500, new { message = "Failed to approve request" });
                }

                // ✅ ACTUALIZEAZĂ USER-UL CU IsSeller = true
                _logger.LogInformation("✅ Actualizez user-ul cu IsSeller = true pentru UserId: {UserId}", user.Id);
                user.IsSeller = true;
                user.IsVerified = true;
                _data.UpdateUser(user);

                _logger.LogInformation("✅ Cererea a fost aprobată cu succes pentru UserId: {UserId}. IsSeller a fost setat pe true.", 
                    user.Id);

                return Ok(new
                {
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    Status = "approved",
                    UpdatedAt = DateTime.UtcNow,
                    IsSellerUpdated = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Eroare la aprobarea cererii: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- PUT: api/pendingapprove/{id}/reject
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest request)
        {
            try
            {
                _logger.LogInformation("🔄 Încep procesul de respingere pentru cererea ID: {Id}", id);

                var pendingApprove = _data.GetPendingApproveById(id);
                if (pendingApprove == null)
                {
                    _logger.LogWarning("❌ Cererea de aprobare cu ID: {Id} nu a fost găsită", id);
                    return NotFound(new { message = "Pending approval not found" });
                }

                _logger.LogInformation("✅ Cererea găsită pentru UserId: {UserId}", pendingApprove.UserId);

                // ✅ Șterge fișierul foto din Google Cloud dacă există
                if (!string.IsNullOrEmpty(pendingApprove.Photo) && pendingApprove.Photo != "[REDACTED]" && pendingApprove.Photo != " ")
                {
                    _logger.LogInformation("🗑️ Șterg fișierul foto pentru cererea ID: {Id}", id);
                    var filePath = ExtractGcsFilePath(pendingApprove.Photo);
                    
                    // ✅ CORECTAT: Adăugat parametrul bucketName
                    await _googleCloudService.DeleteFileAsync(filePath, DOCUMENTS_BUCKET);
                    _logger.LogInformation("✅ Fișierul foto a fost șters cu succes");
                }

                // ✅ Folosește metoda unificată pentru respingere care face totul într-o singură operațiune
                var success = _data.RejectAndCleanData(id, request.Reason);

                if (!success)
                {
                    _logger.LogError("❌ Eroare la respingerea și curățarea datelor pentru cererea ID: {Id}", id);
                    return StatusCode(500, new { message = "Failed to reject request" });
                }

                _logger.LogInformation("✅ Cererea a fost respinsă cu succes pentru UserId: {UserId}", pendingApprove.UserId);

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
                _logger.LogError(ex, "❌ Eroare la respingerea cererii: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- DELETE: api/pendingapprove/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                _logger.LogInformation("🔄 Încep procesul de ștergere pentru cererea ID: {Id}", id);

                var result = _data.DeletePendingApprove(id);
                if (!result)
                {
                    _logger.LogWarning("❌ Nu se poate șterge cererea ID: {Id} - probabil este mai nouă de 1 lună", id);
                    return BadRequest(new { message = "Cannot delete this request. You can only delete requests older than 1 month." });
                }

                _logger.LogInformation("✅ Cererea ID: {Id} a fost ștearsă cu succes", id);

                return Ok(new { message = "Deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Eroare la ștergerea cererii {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }

    public class RejectRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}