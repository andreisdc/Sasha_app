using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using System.Security.Cryptography;
using System.Text;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly DataMap _data;

        public AuthController(DataMap data)
        {
            _data = data;
        }

        [HttpPost("signup")]
        public IActionResult Signup([FromBody] SignupRequest req)
        {
            if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password))
                return BadRequest(new { message = "Email and password are required" });

            if (_data.UserExists(req.Email))
                return Conflict(new { message = "Email already registered" });

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = req.FirstName,
                LastName = req.LastName,
                Username = req.Username,
                Email = req.Email,
                PhoneNumber = req.PhoneNumber,
                PasswordHash = HashPassword(req.Password),
                Rating = 0,
                CreatedAt = DateTime.UtcNow
            };

            _data.AddUser(user);

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _data.GetUsers().FirstOrDefault(u => u.Email == req.Email);
            if (user == null || user.PasswordHash != HashPassword(req.Password))
                return Unauthorized(new { message = "Invalid credentials" });

            var token = Guid.NewGuid().ToString();
            var expiresAt = DateTime.UtcNow.AddDays(1);

            _data.AddSession(user.Id, token, expiresAt);

            Response.Cookies.Append("AuthToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Expires = expiresAt
            });

            return Ok(new
            {
                token,
                username = user.Username,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                expiresAt
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            if (!Request.Cookies.TryGetValue("AuthToken", out var token))
                return BadRequest(new { message = "No token provided" });

            _data.DeleteSession(token);
            Response.Cookies.Delete("AuthToken");

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpGet("me")]
public IActionResult Me()
{
    if (!HttpContext.Items.TryGetValue("User", out var userObj) || userObj is not User user)
        return Unauthorized(new { message = "Not logged in" });

    return Ok(new
    {
        user.Id,
        user.Username,
        user.Email,
        user.PhoneNumber,
        user.FirstName,
        user.LastName,
        user.Rating
    });
}


        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}
