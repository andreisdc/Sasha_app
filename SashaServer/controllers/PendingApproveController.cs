using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PendingApproveController : ControllerBase
    {
        private readonly DataMap _data;
        private readonly ILogger<PendingApproveController> _logger;

        public PendingApproveController(DataMap data, ILogger<PendingApproveController> logger)
        {
            _data = data;
            _logger = logger;
        }

        // GET: api/pendingapprove
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var pendingApproves = _data.GetAllPendingApprove();
                return Ok(pendingApproves);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all pending approvals");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/pendingapprove/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var pendingApprove = _data.GetPendingApproveById(id);
                if (pendingApprove == null)
                    return NotFound(new { message = "Pending approval not found" });

                return Ok(pendingApprove);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending approval by id: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/pendingapprove
        [HttpPost]
        public IActionResult Create([FromBody] PendingApprove pendingApprove)
        {
            try
            {
                if (pendingApprove.Id == Guid.Empty)
                    pendingApprove.Id = Guid.NewGuid();

                if (pendingApprove.CreatedAt == default)
                    pendingApprove.CreatedAt = DateTime.UtcNow;

                _data.AddPendingApprove(pendingApprove);
                
                return CreatedAtAction(nameof(GetById), new { id = pendingApprove.Id }, pendingApprove);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating pending approval");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/pendingapprove/{id}
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

        // DELETE: api/pendingapprove/{id}
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

        // PUT: api/pendingapprove/{id}/approve
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

                // Actualizează user-ul ca fiind verified
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

        // PUT: api/pendingapprove/{id}/reject
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
    }

    public class RejectRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}