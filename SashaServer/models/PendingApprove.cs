using System;
using System.ComponentModel.DataAnnotations;

namespace SashaServer.Models
{
    public class PendingApprove
    {
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(13)]
        public string Cnp { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Address { get; set; } = string.Empty; // ✅ ADAUGĂ ACEST CÂMP

        public string? Photo { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, approved, rejected

        public string? FailReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; } // ✅ ADAUGĂ ACEST CÂMP
    }
}