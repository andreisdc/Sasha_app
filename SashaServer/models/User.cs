using System;
using System.ComponentModel.DataAnnotations;

namespace SashaServer.Models
{
    public class User
    {
        public Guid Id { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string? ProfilePicture { get; set; }

        public int Rating { get; set; } = 0;

        public bool IsSeller { get; set; } = false;

        public bool IsHost { get; set; } = false;

        public bool IsAdmin { get; set; } = false;

        public bool IsVerified { get; set; } = false;

        public string? PhoneNumber { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}