using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly DataMap _data;

        public UserController(DataMap data) => _data = data;

        [HttpPost("signup")]
        public IActionResult Signup([FromBody] User user)
        {
            if (!IsValidEmail(user.Email) || string.IsNullOrWhiteSpace(user.Username))
                return BadRequest(new { message = "Invalid input" });

            if (_data.UserExists(user.Email))
                return Conflict(new { message = "Email already registered" });

            user.PasswordHash = HashPassword(user.PasswordHash);
            user.IsActive = true;
            _data.AddUser(user);

            return Ok(new { message = "User created successfully" });
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _data.GetUsers();
            return Ok(users.Select(u => new { u.Username, u.Email, u.IsActive, u.CreatedAt }));
        }

        [HttpGet("search")]
        public IActionResult SearchUser(string email)
        {
            if (!IsValidEmail(email))
                return BadRequest(new { message = "Invalid email" });

            var user = _data.GetUsers().FirstOrDefault(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new { message = "User found", user = new { user.Username, user.Email, user.IsActive } });
        }

        [HttpDelete("{email}")]
        public IActionResult DeleteUser(string email)
        {
            if (!IsValidEmail(email))
                return BadRequest(new { message = "Invalid email" });

            if (!_data.DeleteUser(email))
                return NotFound(new { message = "User not found" });

            return Ok(new { message = $"User {email} deleted successfully" });
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }

        private static bool IsValidEmail(string email)
        {
            return Regex.IsMatch(email ?? "", @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        }
    }
}
