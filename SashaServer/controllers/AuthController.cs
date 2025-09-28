using Microsoft.AspNetCore.Mvc;
using SashaServer.Data;
using SashaServer.Models;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;

namespace SashaServer.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly DataMap _data;
        private readonly ILogger<AuthController> _logger;

        public AuthController(DataMap data, ILogger<AuthController> logger)
        {
            _data = data;
            _logger = logger;
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
    var user = _data.GetUserByEmail(req.Email);
    if (user == null || user.PasswordHash != HashPassword(req.Password))
        return Unauthorized(new { message = "Invalid credentials" });

    // Ștergem toate sesiunile existente pentru acest user
    _data.DeleteAllSessionsForUser(user.Id);

    // Creăm sesiunea nouă
    var token = Guid.NewGuid().ToString();
    var expiresAt = req.RememberMe ? DateTime.UtcNow.AddMonths(1) : DateTime.UtcNow.AddDays(1);
    _data.AddSession(user.Id, token, expiresAt);

    Response.Cookies.Append("AuthToken", token, new CookieOptions
    {
        HttpOnly = true,
        Secure = false, // pune true în producție cu HTTPS
        Expires = expiresAt,
        SameSite = SameSiteMode.Strict
    });

    return Ok(new
    {
        token,
        username = user.Username,
        email = user.Email,
        phoneNumber = user.PhoneNumber,
        firstName = user.FirstName,
        lastName = user.LastName,
        rating = user.Rating,
        profilePicture = user.ProfilePicture,
        isSeller = user.IsSeller,
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
            if (!Request.Cookies.TryGetValue("AuthToken", out var token))
                return Unauthorized(new { message = "Not logged in" });

            var user = _data.GetUserByToken(token);
            if (user == null) return Unauthorized(new { message = "Session expired or invalid" });

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.PhoneNumber,
                user.FirstName,
                user.LastName,
                user.Rating,
                user.ProfilePicture
            });
        }

        [HttpPut("update")]
        public IActionResult UpdateUser([FromBody] UpdateUserRequest req)
        {
            if (!Request.Cookies.TryGetValue("AuthToken", out var token))
                return Unauthorized(new { message = "Not logged in" });

            var user = _data.GetUserByToken(token);
            if (user == null) return Unauthorized(new { message = "Session expired or invalid" });

            user.Username = req.Username ?? user.Username;
            user.PhoneNumber = req.PhoneNumber ?? user.PhoneNumber;
            user.ProfilePicture = req.ProfilePicture ?? user.ProfilePicture;

            _data.UpdateUser(user);
            return Ok(new { message = "User updated", user });
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}
