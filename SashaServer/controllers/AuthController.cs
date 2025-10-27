using Microsoft.AspNetCore.Authorization;
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
                IsSeller = false,        // ✅ Default false la înregistrare
                IsAdmin = false,         // ✅ Default false la înregistrare
                IsVerified = false,      // ✅ Default false - necesită verificare email/etc
                CreatedAt = DateTime.UtcNow
            };

            _data.AddUser(user);
            return Ok(new { message = "User registered successfully" });
        }

        [HttpGet("check-admin")]

        public IActionResult CheckAdminAccess()
        {
            try
            {
                if (!Request.Cookies.TryGetValue("AuthToken", out var token))
                {
                    _logger.LogWarning("No AuthToken cookie found");
                    return Ok(new { hasAccess = false });
                }

                var user = _data.GetUserByToken(token);

                if (user == null)
                {
                    _logger.LogWarning($"User not found for token: {token}");
                    return Ok(new { hasAccess = false });
                }

                // 🔹 Log valoarea IsAdmin
                _logger.LogInformation($"User {user.Email} IsAdmin = {user.IsAdmin}");

                if (!user.IsAdmin)
                {
                    _logger.LogWarning($"Unauthorized admin access attempt by user: {user.Email}");
                    return Ok(new { hasAccess = false });
                }

                return Ok(new { hasAccess = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking admin access");
                return Ok(new { hasAccess = false });
            }
        }


        [HttpGet("check-seller")]
        public IActionResult CheckSellerAccess()
        {
            try
            {
                if (!Request.Cookies.TryGetValue("AuthToken", out var token))
                    return Ok(new { hasAccess = false });

                var user = _data.GetUserByToken(token);
                
                // ✅ Verifică în baza de date DE FIECARE DATĂ
                if (user == null || !user.IsSeller)
                {
                    return Ok(new { hasAccess = false });
                }

                return Ok(new { hasAccess = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking seller access");
                return Ok(new { hasAccess = false });
            }
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
                isSeller = user.IsSeller,    // ✅ Pentru UX în frontend
                isAdmin = user.IsAdmin,      // ✅ Pentru UX în frontend
                isVerified = user.IsVerified,// ✅ Pentru UX în frontend
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
                user.ProfilePicture,
                isSeller = user.IsSeller,    // ✅ Pentru UX în frontend
                isAdmin = user.IsAdmin,      // ✅ Pentru UX în frontend
                isVerified = user.IsVerified // ✅ Pentru UX în frontend
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
            return Ok(new { 
                message = "User updated", 
                user = new {
                    user.Username,
                    user.PhoneNumber,
                    user.ProfilePicture,
                    isSeller = user.IsSeller,    // ✅ Include și noile câmpuri
                    isAdmin = user.IsAdmin,
                    isVerified = user.IsVerified
                }
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