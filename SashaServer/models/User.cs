using System;

namespace SashaServer.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string FirstName { get; set; } = string.Empty;
        public string LastName  { get; set; } = string.Empty;
        public string Username  { get; set; } = string.Empty;
        public string Email     { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        // Always starts at 0
        public int Rating { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
