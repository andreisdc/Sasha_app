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
        private readonly ILogger<AuthController> _logger;

        public AuthController(DataMap data, ILogger<AuthController> logger)
        {
            _data = data;
            _logger = logger;
        }

        [HttpPost("signup")]
        public IActionResult Signup([FromBody] SignupRequest req)
        {
            _logger.LogInformation("[{Time}] Signup attempt for email: {Email}", DateTime.UtcNow, req.Email);

            if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password))
            {
                _logger.LogWarning("[{Time}] Signup failed: missing email or password", DateTime.UtcNow);
                return BadRequest(new { message = "Email and password are required" });
            }

            if (_data.UserExists(req.Email))
            {
                _logger.LogWarning("[{Time}] Signup failed: email already registered: {Email}", DateTime.UtcNow, req.Email);
                return Conflict(new { message = "Email already registered" });
            }

            Console.Write(req);

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

            _logger.LogInformation("[{Time}] User registered successfully: {Email}", DateTime.UtcNow, req.Email);
            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            _logger.LogInformation("[{Time}] Login attempt for email: {Email}", DateTime.UtcNow, req.Email);

            var user = _data.GetUsers().FirstOrDefault(u => u.Email == req.Email);
            if (user == null || user.PasswordHash != HashPassword(req.Password))
            {
                _logger.LogWarning("[{Time}] Login failed: invalid credentials for email: {Email}", DateTime.UtcNow, req.Email);
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var token = Guid.NewGuid().ToString();
            var expiresAt = DateTime.UtcNow.AddDays(1);

            _data.AddSession(user.Id, token, expiresAt);

            Response.Cookies.Append("AuthToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Expires = expiresAt
            });

            _logger.LogInformation("[{Time}] Login successful: {Email}, Token issued", DateTime.UtcNow, req.Email);

            return Ok(new
            {
                token,
                username = user.Username,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                rating = user.Rating,   
                expiresAt
            });

        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            _logger.LogInformation("[{Time}] Logout attempt", DateTime.UtcNow);

            if (!Request.Cookies.TryGetValue("AuthToken", out var token))
            {
                _logger.LogWarning("[{Time}] Logout failed: no token provided", DateTime.UtcNow);
                return BadRequest(new { message = "No token provided" });
            }

            _data.DeleteSession(token);
            Response.Cookies.Delete("AuthToken");

            _logger.LogInformation("[{Time}] Logout successful, token deleted", DateTime.UtcNow);
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpGet("me")]
        public IActionResult Me()
        {
            if (!HttpContext.Items.TryGetValue("User", out var userObj) || userObj is not User user)
            {
                _logger.LogWarning("[{Time}] Me request failed: user not logged in", DateTime.UtcNow);
                return Unauthorized(new { message = "Not logged in" });
            }

            _logger.LogInformation("[{Time}] Me request success: {Email}", DateTime.UtcNow, user.Email);
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

        [HttpPut("update")]
        public IActionResult UpdateUser([FromBody] UpdateUserRequest req)
        {
            if (!HttpContext.Items.TryGetValue("User", out var userObj) || userObj is not User user)
                return Unauthorized(new { message = "Not logged in" });

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
