using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using SashaServer.Services;
using SashaServer.Helpers;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

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
                var pendingApproves = _data.GetAllPendingApprove()
                    .Select(p => new
                    {
                        p.Id,
                        p.UserId,
                        p.FirstName,
                        p.LastName,
                        Cnp = _cnpHelper.MaskCnp(_cnpHelper.DecryptCnp(p.Cnp)),
                        p.Photo,
                        p.Status,
                        p.FailReason,
                        p.CreatedAt
                    });

                return Ok(pendingApproves);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all pending approvals");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- GET: api/pendingapprove/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var pendingApprove = _data.GetPendingApproveById(id);
                if (pendingApprove == null)
                    return NotFound(new { message = "Pending approval not found" });

                var response = new
                {
                    pendingApprove.Id,
                    pendingApprove.UserId,
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    Cnp = _cnpHelper.MaskCnp(_cnpHelper.DecryptCnp(pendingApprove.Cnp)),
                    pendingApprove.Photo,
                    pendingApprove.Status,
                    pendingApprove.FailReason,
                    pendingApprove.CreatedAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending approval by id: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- POST: api/pendingapprove/create
        [HttpPost("create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create(
            [FromForm] Guid UserId,
            [FromForm] string FirstName,
            [FromForm] string LastName,
            [FromForm] string Cnp,
            [FromForm] IFormFile Photo)
        {
            try
            {
                if (Photo == null || Photo.Length == 0)
                    return BadRequest(new { message = "Photo is required" });

                var pendingApprove = new PendingApprove
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    FirstName = FirstName,
                    LastName = LastName,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    Cnp = _cnpHelper.EncryptCnp(Cnp)
                };

                // Upload photo to GCP
                using var ms = new MemoryStream();
                await Photo.CopyToAsync(ms);
                ms.Position = 0;

                var fileName = $"{pendingApprove.Id}.png";
                var uploadResult = await _googleCloudService.UploadFileAsync(ms, fileName, "image/png");

                if (!uploadResult.Success)
                    return StatusCode(500, new { message = "Failed to upload photo", error = uploadResult.ErrorMessage });

                pendingApprove.Photo = uploadResult.FileUrl;

                _data.AddPendingApprove(pendingApprove);

                var response = new
                {
                    pendingApprove.Id,
                    pendingApprove.UserId,
                    pendingApprove.FirstName,
                    pendingApprove.LastName,
                    Cnp = _cnpHelper.MaskCnp(Cnp),
                    pendingApprove.Photo,
                    pendingApprove.Status,
                    pendingApprove.CreatedAt
                };

                return CreatedAtAction(nameof(GetById), new { id = pendingApprove.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating pending approval with photo");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }


        // --- PUT: api/pendingapprove/{id}
        [HttpPut("{id}")]
        public IActionResult Update(Guid id, [FromBody] PendingApprove pendingApprove)
        {
            try
            {
                if (id != pendingApprove.Id)
                    return BadRequest(new { message = "ID mismatch" });

                var existing = _data.GetPendingApproveById(id);
                if (existing == null)
                    return NotFound(new { message = "Pending approval not found" });

                var success = _data.UpdatePendingApprove(pendingApprove);
                if (!success)
                    return StatusCode(500, new { message = "Failed to update pending approval" });

                return Ok(pendingApprove);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating pending approval: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- DELETE: api/pendingapprove/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                var existing = _data.GetPendingApproveById(id);
                if (existing == null)
                    return NotFound(new { message = "Pending approval not found" });

                var success = _data.DeletePendingApprove(id);
                if (!success)
                    return StatusCode(500, new { message = "Failed to delete pending approval" });

                return Ok(new { message = "Pending approval deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting pending approval: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- PUT: api/pendingapprove/{id}/approve
        [HttpPut("{id}/approve")]
        public IActionResult Approve(Guid id)
        {
            try
            {
                var pendingApprove = _data.GetPendingApproveById(id);
                if (pendingApprove == null)
                    return NotFound(new { message = "Pending approval not found" });

                pendingApprove.Status = "approved";
                pendingApprove.FailReason = null;

                var user = _data.GetUserById(pendingApprove.UserId);
                if (user != null)
                {
                    user.IsVerified = true;
                    user.IsHost = true;
                    _data.UpdateUser(user);
                }

                var success = _data.UpdatePendingApprove(pendingApprove);
                if (!success)
                    return StatusCode(500, new { message = "Failed to approve request" });

                return Ok(pendingApprove);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving pending request: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // --- PUT: api/pendingapprove/{id}/reject
        [HttpPut("{id}/reject")]
        public IActionResult Reject(Guid id, [FromBody] RejectRequest request)
        {
            try
            {
                var pendingApprove = _data.GetPendingApproveById(id);
                if (pendingApprove == null)
                    return NotFound(new { message = "Pending approval not found" });

                pendingApprove.Status = "rejected";
                pendingApprove.FailReason = request.Reason;

                var success = _data.UpdatePendingApprove(pendingApprove);
                if (!success)
                    return StatusCode(500, new { message = "Failed to reject request" });

                return Ok(pendingApprove);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting pending request: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private string CleanBase64(string base64)
{
    if (string.IsNullOrEmpty(base64))
        return string.Empty;

    // elimină prefix dacă vine cumva cu "data:image/.."
    var commaIndex = base64.IndexOf(",");
    if (commaIndex >= 0)
        base64 = base64.Substring(commaIndex + 1);

    // elimină spații, newline etc.
    return base64.Trim().Replace(" ", "").Replace("\n", "").Replace("\r", "");
}
    }

    public class RejectRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    
}


