using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using SashaServer.Services;
using SashaServer.Helpers;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.IO;
using System.Threading.Tasks;

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
            [FromForm] IFormFile Photo)
        {
            try
            {
                if (Photo == null || Photo.Length == 0)
                    return BadRequest(new { message = "Photo is required" });

                var pendingApprove = new PendingApprove
                {
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

                _data.CleanSensitiveData(id);

                if (!string.IsNullOrEmpty(pendingApprove.Photo))
                {
                    var fileName = Path.GetFileName(pendingApprove.Photo);
                    await _googleCloudService.DeleteFileAsync(fileName);
                }

                pendingApprove.Status = "approved";
                pendingApprove.FailReason = null;
                pendingApprove.UpdatedAt = DateTime.UtcNow;
                pendingApprove.Cnp = null;
                pendingApprove.Address = null;
                pendingApprove.Photo = null;

                _data.UpdatePendingApprove(pendingApprove);

                return Ok(new
                {
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    pendingApprove.Status,
                    pendingApprove.UpdatedAt
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

                _data.CleanSensitiveData(id);

                if (!string.IsNullOrEmpty(pendingApprove.Photo))
                {
                    var fileName = Path.GetFileName(pendingApprove.Photo);
                    await _googleCloudService.DeleteFileAsync(fileName);
                }

                pendingApprove.Status = "rejected";
                pendingApprove.FailReason = request.Reason;
                pendingApprove.UpdatedAt = DateTime.UtcNow;
                pendingApprove.Cnp = null;
                pendingApprove.Address = null;
                pendingApprove.Photo = null;

                _data.UpdatePendingApprove(pendingApprove);

                return Ok(new
                {
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    pendingApprove.Status,
                    pendingApprove.FailReason,
                    pendingApprove.UpdatedAt
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
