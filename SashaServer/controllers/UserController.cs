using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using System.Text.RegularExpressions;
using BCrypt.Net;

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

            // Hash the password properly with BCrypt
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

            // Ensure default values
            user.Rating = 0;
            user.CreatedAt = DateTime.UtcNow;

            _data.AddUser(user);

            return Ok(new { message = "User created successfully" });
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _data.GetUsers();
            return Ok(users.Select(u => new 
            { 
                u.FirstName,
                u.LastName,
                u.Username, 
                u.Email, 
                u.Rating, 
                u.CreatedAt 
            }));
        }

        [HttpGet("search")]
        public IActionResult SearchUser(string email)
        {
            if (!IsValidEmail(email))
                return BadRequest(new { message = "Invalid email" });

            var user = _data.GetUsers().FirstOrDefault(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new 
            { 
                message = "User found", 
                user = new 
                { 
                    user.FirstName,
                    user.LastName,
                    user.Username, 
                    user.Email, 
                    user.Rating 
                } 
            });
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

        private static bool IsValidEmail(string email)
        {
            return Regex.IsMatch(email ?? "", @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        }
    }
}
